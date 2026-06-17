package com.community.qna;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, UUID> {
    @Query("SELECT a FROM Answer a WHERE a.question.id = :questionId AND a.status = 'PUBLISHED' ORDER BY a.createdAt ASC")
    List<Answer> findByQuestionIdOrderByCreatedAtAsc(@Param("questionId") UUID questionId);
    int countByQuestionId(UUID questionId);
    @Query("SELECT a FROM Answer a WHERE a.author.id = :userId AND a.status = 'DRAFT' ORDER BY a.updatedAt DESC")
    Page<Answer> findDraftsByUserId(@Param("userId") UUID userId, Pageable pageable);
}
