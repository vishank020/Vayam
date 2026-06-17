package com.community.email;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import jakarta.mail.MessagingException;

@Component
public class EmailConfigurationChecker implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(EmailConfigurationChecker.class);
    private final JavaMailSender mailSender;

    public EmailConfigurationChecker(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void run(String... args) {
        log.info("Testing SMTP connection on startup...");
        if (mailSender instanceof JavaMailSenderImpl mailSenderImpl) {
            try {
                mailSenderImpl.testConnection();
                log.info("SMTP connection tested successfully. Credentials are valid.");
            } catch (MessagingException e) {
                log.error("\n======================================================================\n"
                        + "  CRITICAL: SMTP Authentication Failed!\n"
                        + "  The application will not be able to send verification or reset emails.\n"
                        + "  Error: {}\n"
                        + "======================================================================\n", e.getMessage(), e);
            } catch (Exception e) {
                log.warn("SMTP connectivity check encountered an error: {}", e.getMessage());
            }
        } else {
            log.warn("JavaMailSender is not an instance of JavaMailSenderImpl. Skipping startup SMTP auth check.");
        }
    }
}
