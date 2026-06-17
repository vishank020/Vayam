package com.community.admin;

import com.community.admin.dto.AdminReportResponse;
import com.community.admin.dto.AdminUserSummary;
import com.community.comment.CommentRepository;
import com.community.mute.MuteService;
import com.community.post.PostRepository;
import com.community.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

@Service
public class AdminService {

    private final JdbcTemplate jdbcTemplate;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final MuteService muteService;
    private final UserRepository userRepository;

    public AdminService(JdbcTemplate jdbcTemplate, PostRepository postRepository,
                        CommentRepository commentRepository, MuteService muteService,
                        UserRepository userRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.muteService = muteService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminReportResponse> getReports(String status, Pageable pageable) {
        String effectiveStatus = (status != null && !status.isBlank()) ? status.toUpperCase() : "OPEN";

        Long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM reports WHERE status = ?",
            Long.class, effectiveStatus);

        List<AdminReportResponse> reports = jdbcTemplate.query(
            """
            SELECT r.id, r.reason, r.created_at, r.status,
                   rep.id AS reporter_id, rep.username AS reporter_username,
                   repu.id AS reported_user_id, repu.username AS reported_username,
                   r.reported_post_id, p.title AS post_title
            FROM reports r
            JOIN users rep ON r.reporter_id = rep.id
            JOIN users repu ON r.reported_user_id = repu.id
            LEFT JOIN posts p ON r.reported_post_id = p.id
            WHERE r.status = ?
            ORDER BY r.created_at DESC
            LIMIT ? OFFSET ?
            """,
            new AdminReportRowMapper(),
            effectiveStatus, pageable.getPageSize(), pageable.getOffset());

        return new PageImpl<>(reports, pageable, total != null ? total : 0L);
    }

    @Transactional
    public void resolveReport(UUID reportId) {
        int updated = jdbcTemplate.update(
            "UPDATE reports SET status = 'RESOLVED' WHERE id = ? AND status = 'OPEN'",
            reportId);
        if (updated == 0) {
            throw new IllegalArgumentException("Report not found or already resolved");
        }
    }

    @Transactional
    public void deletePost(UUID postId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("Post not found");
        }
        postRepository.deleteById(postId);
    }

    @Transactional
    public void deleteComment(UUID commentId) {
        if (!commentRepository.existsById(commentId)) {
            throw new IllegalArgumentException("Comment not found");
        }
        commentRepository.deleteById(commentId);
    }

    @Transactional
    public void muteUser(UUID adminUserId, UUID targetUserId) {
        muteService.mute(adminUserId.toString(), targetUserId.toString());
    }

    @Transactional
    public void unmuteUser(UUID adminUserId, UUID targetUserId) {
        muteService.unmute(adminUserId.toString(), targetUserId.toString());
    }

    @Transactional(readOnly = true)
    public Page<AdminUserSummary> searchUsers(String query, Pageable pageable) {
        String likePattern = "%" + query.toLowerCase() + "%";

        Long total = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE LOWER(username) LIKE ?",
            Long.class, likePattern);

        List<AdminUserSummary> users = jdbcTemplate.query(
            """
            SELECT u.id, u.username, COALESCE(p.display_name, u.username) AS display_name,
                   u.role, u.created_at,
                   COALESCE((SELECT COUNT(*) FROM reports r WHERE r.reported_user_id = u.id AND r.status = 'OPEN'), 0) AS open_report_count
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE LOWER(u.username) LIKE ?
            ORDER BY u.username
            LIMIT ? OFFSET ?
            """,
            new AdminUserRowMapper(),
            likePattern, pageable.getPageSize(), pageable.getOffset());

        return new PageImpl<>(users, pageable, total != null ? total : 0L);
    }

    private static class AdminReportRowMapper implements RowMapper<AdminReportResponse> {
        @Override
        public AdminReportResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            UUID reportedPostId = rs.getObject("reported_post_id", UUID.class);
            AdminReportResponse.ReportedPostInfo postInfo = null;
            if (reportedPostId != null) {
                postInfo = new AdminReportResponse.ReportedPostInfo(
                    reportedPostId,
                    rs.getString("post_title")
                );
            }
            return new AdminReportResponse(
                rs.getObject("id", UUID.class),
                rs.getString("reason"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getString("status"),
                new AdminReportResponse.ReporterInfo(
                    rs.getObject("reporter_id", UUID.class),
                    rs.getString("reporter_username")
                ),
                new AdminReportResponse.ReportedUserInfo(
                    rs.getObject("reported_user_id", UUID.class),
                    rs.getString("reported_username")
                ),
                postInfo
            );
        }
    }

    private static class AdminUserRowMapper implements RowMapper<AdminUserSummary> {
        @Override
        public AdminUserSummary mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new AdminUserSummary(
                rs.getObject("id", UUID.class),
                rs.getString("username"),
                rs.getString("display_name"),
                rs.getString("role"),
                rs.getTimestamp("created_at").toInstant(),
                rs.getLong("open_report_count")
            );
        }
    }
}
