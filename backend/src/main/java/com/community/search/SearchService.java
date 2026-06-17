package com.community.search;

import com.community.search.dto.SearchResponse;
import com.community.search.dto.SearchResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class SearchService {

    private static final int MAX_PAGE_SIZE = 50;

    private final EntityManager entityManager;

    public SearchService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @SuppressWarnings("unchecked")
    public SearchResponse search(String query, String type, int page, int size) {
        if (query == null || query.isBlank()) {
            return new SearchResponse(List.of(), 0, page, size);
        }

        if (size <= 0 || size > MAX_PAGE_SIZE) size = 20;
        int offset = page * size;

        String searchType = type;
        String searchQuery = query;

        if (query.startsWith("c/") && query.length() > 2) {
            searchType = "communities";
            searchQuery = query.substring(2);
        } else if (query.startsWith("u/") && query.length() > 2) {
            searchType = "users";
            searchQuery = query.substring(2);
        }

        String conditions = switch (searchType) {
            case "posts" -> buildPostWhere();
            case "communities" -> buildCommunityWhere();
            case "users" -> buildUserWhere();
            default -> buildPostWhere() + " UNION ALL " + buildCommunityWhere()
                    + " UNION ALL " + buildUserWhere();
        };

        String countSql = "SELECT COUNT(*) FROM (" + conditions + ") AS cnt";
        String dataSql = "SELECT * FROM (" + conditions + ") AS results ORDER BY rank DESC OFFSET " + offset + " LIMIT " + size;

        Query countQuery = entityManager.createNativeQuery(countSql);
        countQuery.setParameter(1, searchQuery);
        long total = ((Number) countQuery.getSingleResult()).longValue();

        Query dataQuery = entityManager.createNativeQuery(dataSql);
        dataQuery.setParameter(1, searchQuery);
        List<Object[]> rows = dataQuery.getResultList();

        List<SearchResult> results = rows.stream().map(row -> new SearchResult(
                UUID.fromString((String) row[0]),
                (String) row[1],
                (String) row[2],
                (String) row[3],
                (String) row[4],
                (String) row[5]
        )).toList();

        return new SearchResponse(results, total, page, size);
    }

    private String buildPostWhere() {
        return "SELECT CAST(p.id AS text), 'POST' as type, p.title, substring(p.content, 1, 200) as description, "
                + "'/posts/' || CAST(p.id AS text) as url, "
                + "NULL as avatar_url, "
                + "ts_rank(to_tsvector('english', p.title || ' ' || coalesce(p.content, '')), plainto_tsquery('english', ?1)) as rank "
                + "FROM posts p "
                + "WHERE to_tsvector('english', p.title || ' ' || coalesce(p.content, '')) @@ plainto_tsquery('english', ?1)";
    }

    private String buildCommunityWhere() {
        return "SELECT CAST(c.id AS text), 'COMMUNITY' as type, c.name, c.description, "
                + "'/c/' || c.slug as url, "
                + "NULL as avatar_url, "
                + "ts_rank(to_tsvector('english', c.name || ' ' || coalesce(c.description, '')), plainto_tsquery('english', ?1)) as rank "
                + "FROM communities c "
                + "WHERE to_tsvector('english', c.name || ' ' || coalesce(c.description, '')) @@ plainto_tsquery('english', ?1)";
    }

    private String buildUserWhere() {
        return "SELECT CAST(u.id AS text), 'USER' as type, u.username, "
                + "coalesce(up.display_name, u.username) || ' ' || coalesce(up.bio, '') as description, "
                + "'/u/' || u.username as url, "
                + "up.avatar_url, "
                + "ts_rank(to_tsvector('english', u.username || ' ' || coalesce(up.display_name, '') || ' ' || coalesce(up.bio, '')), plainto_tsquery('english', ?1)) as rank "
                + "FROM users u "
                + "LEFT JOIN user_profiles up ON up.user_id = u.id "
                + "WHERE to_tsvector('english', u.username || ' ' || coalesce(up.display_name, '') || ' ' || coalesce(up.bio, '')) @@ plainto_tsquery('english', ?1)";
    }
}
