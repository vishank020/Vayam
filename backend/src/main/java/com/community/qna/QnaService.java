package com.community.qna;

import com.community.auth.AuthPrincipal;
import com.community.notification.NotificationService;
import com.community.notification.NotificationType;
import com.community.qna.dto.*;
import com.community.qna.vote.QnaVote;
import com.community.qna.vote.QnaVoteRepository;
import com.community.user.User;
import com.community.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class QnaService {

    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final QnaVoteRepository qnaVoteRepository;
    private final NotificationService notificationService;

    public QnaService(QuestionRepository questionRepository,
                      AnswerRepository answerRepository,
                      UserRepository userRepository,
                      QnaVoteRepository qnaVoteRepository,
                      NotificationService notificationService) {
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.qnaVoteRepository = qnaVoteRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public QuestionResponse askQuestion(AuthPrincipal principal, CreateQuestionRequest request) {
        User author = findUser(principal.userId());

        Question question = new Question();
        question.setTitle(request.title());
        question.setBody(request.body());
        question.setAuthor(author);
        questionRepository.save(question);

        return toQuestionResponse(question, true, List.of(), 0, null);
    }

    @Transactional(readOnly = true)
    public Page<QuestionResponse> listQuestions(AuthPrincipal principal, Optional<String> searchQuery, Optional<String> filter, Pageable pageable) {
        Page<Question> questionPage;

        if (searchQuery.isPresent() && !searchQuery.get().isBlank()) {
            questionPage = questionRepository.searchByFullText(searchQuery.get().trim(), pageable);
        } else if (filter.isPresent() && "unanswered".equals(filter.get())) {
            questionPage = questionRepository.findAllByAnswerCountOrderByCreatedAtDesc(0, pageable);
        } else {
            questionPage = questionRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<Question> questions = questionPage.getContent();
        List<UUID> questionIds = questions.stream().map(Question::getId).toList();

        Map<UUID, Integer> voteCounts = batchVoteCounts(questionIds, "QUESTION");
        Map<UUID, Integer> userVotes = principal != null ? batchUserVotes(questionIds, UUID.fromString(principal.userId()), "QUESTION") : Collections.emptyMap();

        return questionPage.map(q -> {
            boolean isAuthor = principal != null && principal.userId().equals(q.getAuthor().getId().toString());
            return toQuestionResponse(q, isAuthor, null, voteCounts.getOrDefault(q.getId(), 0), userVotes.get(q.getId()));
        });
    }

    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(UUID questionId, AuthPrincipal principal) {
        Question question = findQuestion(questionId);

        List<Answer> answers = answerRepository.findByQuestionIdOrderByCreatedAtAsc(questionId);
        boolean isAuthor = principal != null && principal.userId().equals(question.getAuthor().getId().toString());

        int questionVoteCount = qnaVoteRepository.sumValueByTargetIdAndTargetType(questionId, "QUESTION");
        Integer questionUserVote = principal != null
                ? qnaVoteRepository.findByUserIdAndTargetIdAndTargetType(UUID.fromString(principal.userId()), questionId, "QUESTION")
                        .map(QnaVote::getValue).orElse(null)
                : null;

        List<UUID> answerIds = answers.stream().map(Answer::getId).toList();
        Map<UUID, Integer> answerVoteCounts = batchVoteCounts(answerIds, "ANSWER");
        Map<UUID, Integer> answerUserVotes = principal != null ? batchUserVotes(answerIds, UUID.fromString(principal.userId()), "ANSWER") : Collections.emptyMap();

        List<AnswerResponse> answerResponses = answers.stream()
                .map(a -> toAnswerResponse(a, principal, answerVoteCounts.getOrDefault(a.getId(), 0), answerUserVotes.get(a.getId())))
                .toList();

        return toQuestionResponse(question, isAuthor, answerResponses, questionVoteCount, questionUserVote);
    }

    @Transactional
    public AnswerResponse answerQuestion(UUID questionId, AuthPrincipal principal, AnswerQuestionRequest request) {
        Question question = findQuestion(questionId);
        User author = findUser(principal.userId());

        Answer answer = new Answer();
        answer.setQuestion(question);
        answer.setBody(request.body());
        answer.setAuthor(author);
        answerRepository.save(answer);

        question.setAnswerCount(question.getAnswerCount() + 1);
        questionRepository.save(question);

        if (!question.getAuthor().getId().equals(author.getId())) {
            notificationService.createNotification(
                    question.getAuthor().getId(),
                    NotificationType.ANSWER,
                    questionId,
                    "question",
                    author.getId(),
                    author.getUsername() + " answered your question"
            );
        }

        return toAnswerResponse(answer, principal, 0, null);
    }

    @Transactional
    public void acceptAnswer(UUID questionId, UUID answerId, AuthPrincipal principal) {
        Question question = findQuestion(questionId);

        if (principal == null || !principal.userId().equals(question.getAuthor().getId().toString())) {
            throw new IllegalArgumentException("Only the question author can accept an answer");
        }
        
        findUser(principal.userId()); // Enforce email verification check for the question author

        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new IllegalArgumentException("Answer not found"));

        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new IllegalArgumentException("Answer does not belong to this question");
        }

        answerRepository.findByQuestionIdOrderByCreatedAtAsc(questionId)
                .forEach(a -> a.setAccepted(false));

        answer.setAccepted(true);
        answerRepository.save(answer);

        if (!answer.getAuthor().getId().equals(question.getAuthor().getId())) {
            notificationService.createNotification(
                    answer.getAuthor().getId(),
                    NotificationType.ANSWER_ACCEPT,
                    questionId,
                    "question",
                    question.getAuthor().getId(),
                    question.getAuthor().getUsername() + " accepted your answer"
            );
        }
    }

    @Transactional
    public AnswerResponse updateAnswer(UUID questionId, UUID answerId, AuthPrincipal principal, AnswerQuestionRequest request) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new IllegalArgumentException("Answer not found"));

        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new IllegalArgumentException("Answer does not belong to this question");
        }

        if (principal == null || !principal.userId().equals(answer.getAuthor().getId().toString())) {
            throw new IllegalArgumentException("Only the author can edit this answer");
        }

        answer.setBody(request.body());
        if (request.saveAsDraft()) {
            answer.setStatus(AnswerStatus.DRAFT);
        } else if (answer.getStatus() == AnswerStatus.DRAFT) {
            answer.setStatus(AnswerStatus.PUBLISHED);
        }
        answerRepository.save(answer);

        return toAnswerResponse(answer, principal, 0, null);
    }

    @Transactional
    public void deleteAnswer(UUID questionId, UUID answerId, AuthPrincipal principal) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new IllegalArgumentException("Answer not found"));

        if (!answer.getQuestion().getId().equals(questionId)) {
            throw new IllegalArgumentException("Answer does not belong to this question");
        }

        if (principal == null || !principal.userId().equals(answer.getAuthor().getId().toString())) {
            throw new IllegalArgumentException("Only the author can delete this answer");
        }

        Question question = answer.getQuestion();
        question.setAnswerCount(question.getAnswerCount() - 1);
        questionRepository.save(question);

        answerRepository.delete(answer);
    }

    @Transactional
    public QuestionResponse updateQuestion(UUID questionId, AuthPrincipal principal, UpdateQuestionRequest request) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new EntityNotFoundException("Question not found"));

        if (principal == null || !principal.userId().equals(question.getAuthor().getId().toString())) {
            throw new AccessDeniedException("Not the question author");
        }

        question.setTitle(request.title());
        question.setBody(request.body());
        questionRepository.save(question);

        int voteCount = qnaVoteRepository.sumValueByTargetIdAndTargetType(questionId, "QUESTION");
        Integer userVote = principal != null
                ? qnaVoteRepository.findByUserIdAndTargetIdAndTargetType(UUID.fromString(principal.userId()), questionId, "QUESTION")
                        .map(QnaVote::getValue).orElse(null)
                : null;
        return toQuestionResponse(question, true, null, voteCount, userVote);
    }

    @Transactional
    public void deleteQuestion(UUID questionId, AuthPrincipal principal) {
        Question question = findQuestion(questionId);

        if (principal == null || !principal.userId().equals(question.getAuthor().getId().toString())) {
            throw new IllegalArgumentException("Only the author can delete this question");
        }

        questionRepository.delete(question);
    }

    @Transactional(readOnly = true)
    public Page<AnswerResponse> getUserDraftAnswers(AuthPrincipal principal, Pageable pageable) {
        if (principal == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        UUID userId = UUID.fromString(principal.userId());
        return answerRepository.findDraftsByUserId(userId, pageable)
                .map(a -> toAnswerResponse(a, principal, 0, null));
    }

    private Question findQuestion(UUID id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Question not found"));
    }

    private User findUser(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Email address is not verified. Please verify your email to perform this action.");
        }
        return user;
    }

    @Transactional
    public VoteResponse voteOnTarget(UUID targetId, String targetType, int value, AuthPrincipal principal) {
        if (principal == null) {
            throw new AccessDeniedException("Authentication required");
        }
        findUser(principal.userId());
        UUID userId = UUID.fromString(principal.userId());

        if ("QUESTION".equals(targetType)) {
            Question question = findQuestion(targetId);
            if (principal.userId().equals(question.getAuthor().getId().toString())) {
                throw new AccessDeniedException("Cannot vote on own question");
            }
        } else if ("ANSWER".equals(targetType)) {
            Answer answer = answerRepository.findById(targetId)
                    .orElseThrow(() -> new EntityNotFoundException("Answer not found"));
            if (principal.userId().equals(answer.getAuthor().getId().toString())) {
                throw new AccessDeniedException("Cannot vote on own answer");
            }
        } else {
            throw new IllegalArgumentException("Invalid target type: " + targetType);
        }

        Optional<QnaVote> existingOpt = qnaVoteRepository.findByUserIdAndTargetIdAndTargetType(userId, targetId, targetType);

        if (existingOpt.isPresent()) {
            QnaVote existing = existingOpt.get();
            if (existing.getValue() == value) {
                qnaVoteRepository.delete(existing);
            } else {
                existing.setValue(value);
                qnaVoteRepository.save(existing);
            }
        } else {
            QnaVote vote = new QnaVote();
            vote.setUserId(userId);
            vote.setTargetId(targetId);
            vote.setTargetType(targetType);
            vote.setValue(value);
            qnaVoteRepository.save(vote);
        }

        int voteCount = qnaVoteRepository.sumValueByTargetIdAndTargetType(targetId, targetType);
        Integer currentUserVote = existingOpt.isPresent() && existingOpt.get().getValue() == value
                ? null
                : value;

        return new VoteResponse(targetId, voteCount, currentUserVote);
    }

    private Map<UUID, Integer> batchVoteCounts(List<UUID> targetIds, String targetType) {
        if (targetIds.isEmpty()) return Collections.emptyMap();
        return qnaVoteRepository.sumValueByTargetIdsAndTargetType(targetIds, targetType).stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> ((Number) row[1]).intValue()
                ));
    }

    private Map<UUID, Integer> batchUserVotes(List<UUID> targetIds, UUID userId, String targetType) {
        if (targetIds.isEmpty()) return Collections.emptyMap();
        return qnaVoteRepository.findByTargetIdsAndUserIdAndTargetType(targetIds, userId, targetType).stream()
                .collect(Collectors.toMap(
                        QnaVote::getTargetId,
                        QnaVote::getValue
                ));
    }

    private QuestionResponse toQuestionResponse(Question question, boolean isAuthor, List<AnswerResponse> answers, int voteCount, Integer currentUserVote) {
        return new QuestionResponse(
                question.getId(),
                question.getTitle(),
                question.getBody(),
                question.getAuthor().getId(),
                question.getAuthor().getUsername(),
                question.getAnswerCount(),
                isAuthor,
                voteCount,
                currentUserVote,
                answers,
                question.getCreatedAt(),
                question.getUpdatedAt()
        );
    }

    private AnswerResponse toAnswerResponse(Answer answer, AuthPrincipal principal, int voteCount, Integer currentUserVote) {
        boolean isAuthor = principal != null && principal.userId().equals(answer.getAuthor().getId().toString());
        String statusName = answer.getStatus() != null ? answer.getStatus().name() : null;
        return new AnswerResponse(
                answer.getId(),
                answer.getQuestion().getId(),
                answer.getBody(),
                answer.getAuthor().getId(),
                answer.getAuthor().getUsername(),
                answer.isAccepted(),
                isAuthor,
                voteCount,
                currentUserVote,
                answer.getCreatedAt(),
                answer.getUpdatedAt(),
                statusName
        );
    }
}
