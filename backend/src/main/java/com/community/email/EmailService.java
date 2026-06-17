package com.community.email;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

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
    public void sendVerificationEmail(String to, String token) {
        String link = appUrl + "/verify-email?token=" + token;
        String subject = "Verify your email address";
        String body = """
                Welcome to Vayam!
                
                Please verify your email by clicking the link below:
                %s
                
                This link expires in 24 hours.
                If you did not create an account, please ignore this email.
                """.formatted(link);

        send(to, subject, body);
    }

    @Async
    public void sendEmailChangeVerification(String to, String token) {
        String link = appUrl + "/verify-email?token=" + token;
        String subject = "Confirm your new email address";
        String body = """
                You requested to change your email address on Vayam.
                
                Click the link below to confirm:
                %s
                
                This link expires in 24 hours.
                If you did not request this change, please ignore this email.
                """.formatted(link);

        send(to, subject, body);
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String link = appUrl + "/reset-password?token=" + token;
        String subject = "Reset your password";
        String body = """
                You requested to reset your password on Vayam.
                
                Click the link below to set a new password:
                %s
                
                This link expires in 1 hour.
                If you did not request a password reset, please ignore this email.
                """.formatted(link);

        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            // WHY: Email failures should never break the request.
            // Log and swallow — the caller already returned a success response.
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }
}
