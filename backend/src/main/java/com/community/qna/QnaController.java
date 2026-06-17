package com.community.qna;

import com.community.auth.AuthPrincipal;
import com.community.post.dto.VoteRequest;
import com.community.qna.dto.*;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/questions")
public class QnaController {

    private final QnaService qnaService;

    public QnaController(QnaService qnaService) {
        this.qnaService = qnaService;
    }

    @PostMapping
    public ResponseEntity<QuestionResponse> askQuestion(
            @Valid @RequestBody CreateQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(qnaService.askQuestion(getPrincipal(), request));
    }

    @GetMapping
    public ResponseEntity<Page<QuestionResponse>> listQuestions(
            @RequestParam(required = false) String q,
            @RequestParam(required = false, defaultValue = "newest") String filter,
            Pageable pageable) {
        return ResponseEntity.ok(qnaService.listQuestions(getPrincipal(), Optional.ofNullable(q), Optional.of(filter), pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuestionResponse> getQuestion(@PathVariable UUID id) {
        return ResponseEntity.ok(qnaService.getQuestion(id, getPrincipal()));
    }

    @PostMapping("/{id}/answers")
    public ResponseEntity<AnswerResponse> answerQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody AnswerQuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(qnaService.answerQuestion(id, getPrincipal(), request));
    }

    @PutMapping("/{id}/answers/{answerId}")
    public ResponseEntity<AnswerResponse> updateAnswer(
            @PathVariable UUID id,
            @PathVariable UUID answerId,
            @Valid @RequestBody AnswerQuestionRequest request) {
        return ResponseEntity.ok(qnaService.updateAnswer(id, answerId, getPrincipal(), request));
    }

    @DeleteMapping("/{id}/answers/{answerId}")
    public ResponseEntity<Void> deleteAnswer(
            @PathVariable UUID id,
            @PathVariable UUID answerId) {
        qnaService.deleteAnswer(id, answerId, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/answers/{answerId}/accept")
    public ResponseEntity<Void> acceptAnswer(
            @PathVariable UUID id,
            @PathVariable UUID answerId) {
        qnaService.acceptAnswer(id, answerId, getPrincipal());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/answers/drafts")
    public ResponseEntity<Page<AnswerResponse>> getAnswerDrafts(
            Pageable pageable,
            @AuthenticationPrincipal AuthPrincipal principal) {
        return ResponseEntity.ok(qnaService.getUserDraftAnswers(principal, pageable));
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuestionResponse> updateQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateQuestionRequest request) {
        return ResponseEntity.ok(qnaService.updateQuestion(id, getPrincipal(), request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable UUID id) {
        qnaService.deleteQuestion(id, getPrincipal());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<VoteResponse> voteQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody VoteRequest request) {
        return ResponseEntity.ok(qnaService.voteOnTarget(id, "QUESTION", request.direction(), getPrincipal()));
    }

    @PostMapping("/{id}/answers/{answerId}/vote")
    public ResponseEntity<VoteResponse> voteAnswer(
            @PathVariable UUID id,
            @PathVariable UUID answerId,
            @Valid @RequestBody VoteRequest request) {
        return ResponseEntity.ok(qnaService.voteOnTarget(answerId, "ANSWER", request.direction(), getPrincipal()));
    }

    private AuthPrincipal getPrincipal() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthPrincipal) {
            return (AuthPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
