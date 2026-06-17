package com.community.gif;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class GifService {

    private final String giphyApiKey;
    private final RestTemplate restTemplate;

    public GifService(@Value("${giphy.api.key}") String giphyApiKey) {
        this.giphyApiKey = giphyApiKey;
        this.restTemplate = new RestTemplate();
    }

    public String searchGifs(String query) {
        if (giphyApiKey == null || giphyApiKey.trim().isEmpty() || "null".equalsIgnoreCase(giphyApiKey.trim())) {
            return "{\"data\":[]}";
        }
        if (query == null || query.trim().isEmpty()) {
            return "{\"data\":[]}";
        }
        
        String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);
        String url = String.format("https://api.giphy.com/v1/gifs/search?api_key=%s&q=%s&limit=20&rating=g", 
                giphyApiKey, encodedQuery);
                
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getBody();
        } catch (Exception e) {
            return "{\"data\":[]}";
        }
    }
}
