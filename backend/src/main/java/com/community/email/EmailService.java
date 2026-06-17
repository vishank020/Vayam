package com.community.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String appUrl;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from}") String fromAddress,
                        @Value("${app.url}") String appUrl) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
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
        System.out.println("\n=== [VAYAM EMAIL SENT] ===");
        System.out.println("To: " + to);
        System.out.println("Subject: " + subject);
        System.out.println("Body:\n" + body);
        System.out.println("==========================\n");
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email to " + to, e);
            return false;
        }
    }
}
