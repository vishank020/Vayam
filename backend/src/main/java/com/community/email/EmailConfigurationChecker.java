package com.community.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Component
public class EmailConfigurationChecker implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailConfigurationChecker.class);
    private static final String SENDGRID_SCOPES_URL = "https://api.sendgrid.com/v3/scopes";

    private final String apiKey;
    private final HttpClient httpClient;

    public EmailConfigurationChecker(@Value("${app.mail.api-key:}") String apiKey) {
        this.apiKey = apiKey;
        this.httpClient = HttpClient.newBuilder().build();
    }

    @Override
    public void run(String... args) {
        log.info("Testing SendGrid API connectivity on startup...");
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("SendGrid API Key is missing. Email sending will be disabled.");
            return;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(SENDGRID_SCOPES_URL))
                    .header("Authorization", "Bearer " + apiKey)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                log.info("SendGrid API connection verified successfully. API Key is valid.");
            } else {
                log.error("\n======================================================================\n"
                        + "  CRITICAL: SendGrid API Authentication Failed!\n"
                        + "  The application will not be able to send verification or reset emails.\n"
                        + "  Status: {}, Error: {}\n"
                        + "======================================================================\n", 
                        response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("\n======================================================================\n"
                    + "  CRITICAL: SendGrid API connectivity check failed!\n"
                    + "  The application will not be able to send verification or reset emails.\n"
                    + "  Error: {}\n"
                    + "======================================================================\n", 
                    e.getMessage(), e);
        }
    }
}
