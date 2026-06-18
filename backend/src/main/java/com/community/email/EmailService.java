package com.community.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final HttpClient httpClient;
    private final String appUrl;

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.from-email}")
    private String fromEmail;

    public EmailService(@Value("${app.url}") String appUrl) {
        this.httpClient = HttpClient.newBuilder().build();
        this.appUrl = appUrl;
    }

    @Async
    public CompletableFuture<Boolean> sendVerificationEmail(String to, String token) {
        String link = appUrl + "/verify-email?token=" + token;
        String subject = "Verify your email address";
        String body = """
                Welcome to Vayam!
                
                Please verify your email by clicking the link below:
                %s
                
                This link expires in 24 hours.
                If you did not create an account, please ignore this email.
                """.formatted(link);

        boolean success = send(to, subject, body);
        return CompletableFuture.completedFuture(success);
    }

    @Async
    public CompletableFuture<Boolean> sendEmailChangeVerification(String to, String token) {
        String link = appUrl + "/verify-email?token=" + token;
        String subject = "Confirm your new email address";
        String body = """
                You requested to change your email address on Vayam.
                
                Click the link below to confirm:
                %s
                
                This link expires in 24 hours.
                If you did not request this change, please ignore this email.
                """.formatted(link);

        boolean success = send(to, subject, body);
        return CompletableFuture.completedFuture(success);
    }

    @Async
    public CompletableFuture<Boolean> sendPasswordResetEmail(String to, String token) {
        String link = appUrl + "/reset-password?token=" + token;
        String subject = "Reset your password";
        String body = """
                You requested to reset your password on Vayam.
                
                Click the link below to set a new password:
                %s
                
                This link expires in 1 hour.
                If you did not request a password reset, please ignore this email.
                """.formatted(link);

        boolean success = send(to, subject, body);
        return CompletableFuture.completedFuture(success);
    }

    private boolean send(String to, String subject, String body) {
        // ALWAYS log the email details to console/logs so it's easy to test and find links
        System.out.println("\n=== [VAYAM EMAIL SENT via BREVO API] ===");
        System.out.println("To: " + to);
        System.out.println("Subject: " + subject);
        System.out.println("Body:\n" + body);
        System.out.println("============================================\n");

        if (apiKey == null || apiKey.isBlank()) {
            log.error("Brevo API Key is missing. Email cannot be sent.");
            return false;
        }

        try {
            // Escape body content for JSON compatibility
            String jsonBody = createBrevoJson(to, fromEmail, subject, body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                    .header("api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Email sent successfully to {} via Brevo API (Status: {})", to, response.statusCode());
                return true;
            } else {
                log.error("Failed to send email to {} via Brevo API. Status: {}, Body: {}", 
                        to, response.statusCode(), response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send email to " + to + " via Brevo API", e);
            return false;
        }
    }

    private String createBrevoJson(String to, String from, String subject, String textContent) {
        // Simple manual JSON escape helper for special characters
        String escapedText = textContent
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");

        String escapedSubject = subject
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");

        return """
                {
                  "sender": {
                    "email": "%s"
                  },
                  "to": [
                    {
                      "email": "%s"
                    }
                  ],
                  "subject": "%s",
                  "textContent": "%s"
                }
                """.formatted(from, to, escapedSubject, escapedText);
    }
}
