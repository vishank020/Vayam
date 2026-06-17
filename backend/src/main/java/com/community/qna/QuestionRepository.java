package com.community.qna;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    Page<Question> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Question> findAllByAnswerCountOrderByCreatedAtDesc(int answerCount, Pageable pageable);

    @Query(value = """
        SELECT * FROM questions
        WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', :query)
        ORDER BY created_at DESC
        """,
        countQuery = """
        SELECT count(*) FROM questions
        WHERE to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', :query)
        """,
        nativeQuery = true)
    Page<Question> searchByFullText(@Param("query") String query, Pageable pageable);
}
