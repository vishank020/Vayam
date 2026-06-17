package com.community.auth;

import com.community.auth.dto.*;
import com.community.email.EmailService;
import com.community.email.EmailVerificationToken;
import com.community.email.EmailVerificationTokenRepository;
import com.community.user.User;
import com.community.user.UserProfile;
import com.community.user.UserProfileRepository;
import com.community.user.UserRepository;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final long verificationTokenExpiryHours;
    private final long passwordResetTokenExpiryHours;

    public AuthService(UserRepository userRepository,
                       UserProfileRepository userProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       EmailService emailService,
                       EmailVerificationTokenRepository verificationTokenRepository,
                       @Value("${app.mail.verification-token-expiry-hours:24}") long verificationTokenExpiryHours,
                       @Value("${app.mail.password-reset-token-expiry-hours:1}") long passwordResetTokenExpiryHours) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.verificationTokenRepository = verificationTokenRepository;
        this.verificationTokenExpiryHours = verificationTokenExpiryHours;
        this.passwordResetTokenExpiryHours = passwordResetTokenExpiryHours;
    }

    @Transactional
    public AuthTokens register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already taken");
        }

        String emailHash = sha256(request.email());
        if (userRepository.existsByEmailHash(emailHash)) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setEmail(request.email());
        user.setEmailHash(emailHash);
        user.setEmailVerified(false);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        userRepository.save(user);

        // WHY: Creates a UserProfile on registration so display info
        // is separate from auth credentials from day one.
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setDisplayName(request.displayName() != null ? request.displayName() : request.username());
        userProfileRepository.save(profile);

        sendVerificationEmail(user);

        return buildTokens(user);
    }

    public LoginResult login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        if (user.isTotpEnabled()) {
            String tempToken = jwtTokenProvider.generateAccessToken(
                    user.getId().toString(), user.getUsername(), "TEMP_2FA");
            return new LoginResult(null, true, tempToken);
        }

        return new LoginResult(buildTokens(user), false, null);
    }

    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void changeUsername(String userId, UpdateUsernameRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        if (userRepository.existsByUsername(request.newUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }

        user.setUsername(request.newUsername());
        userRepository.save(user);
    }

    @Transactional
    public void changeEmail(String userId, UpdateEmailRequest request) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }

        String emailHash = sha256(request.newEmail());
        if (userRepository.existsByEmailHash(emailHash)) {
            throw new IllegalArgumentException("Email already registered");
        }

        // WHY: Invalidate old tokens so only the latest verification link works.
        verificationTokenRepository.deleteByUserId(user.getId());

        String token = generateToken();
        EmailVerificationToken vt = new EmailVerificationToken();
        vt.setUserId(user.getId());
        vt.setEmail(request.newEmail());
        vt.setToken(token);
        vt.setType("CHANGE_EMAIL");
        vt.setExpiresAt(Instant.now().plusSeconds(verificationTokenExpiryHours * 3600));
        verificationTokenRepository.save(vt);

        boolean sent = emailService.sendEmailChangeVerification(request.newEmail(), token).join();
        if (!sent) {
            throw new IllegalArgumentException("Failed to send verification email. Please check your email configuration.");
        }
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken vt = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired verification token"));

        if (vt.isUsed()) {
            throw new IllegalArgumentException("Verification token already used");
        }

        if (Instant.now().isAfter(vt.getExpiresAt())) {
            throw new IllegalArgumentException("Verification token has expired");
        }

        vt.setUsed(true);
        verificationTokenRepository.save(vt);

        User user = userRepository.findById(vt.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if ("CHANGE_EMAIL".equals(vt.getType())) {
            String newEmailHash = sha256(vt.getEmail());
            user.setEmail(vt.getEmail());
            user.setEmailHash(newEmailHash);
        }

        user.setEmailVerified(true);
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            // WHY: Always return success to prevent email enumeration.
            return;
        }

        verificationTokenRepository.deleteByUserId(user.getId());

        String token = generateToken();
        EmailVerificationToken vt = new EmailVerificationToken();
        vt.setUserId(user.getId());
        vt.setEmail(user.getEmail());
        vt.setToken(token);
        vt.setType("RESET_PASSWORD");
        vt.setExpiresAt(Instant.now().plusSeconds(passwordResetTokenExpiryHours * 3600));
        verificationTokenRepository.save(vt);

        boolean sent = emailService.sendPasswordResetEmail(user.getEmail(), token).join();
        if (!sent) {
            throw new IllegalArgumentException("Failed to send password reset email. Please check your email configuration.");
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        EmailVerificationToken vt = verificationTokenRepository.findByToken(request.token())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset token"));

        if (vt.isUsed()) {
            throw new IllegalArgumentException("Reset token already used");
        }

        if (Instant.now().isAfter(vt.getExpiresAt())) {
            throw new IllegalArgumentException("Reset token has expired");
        }

        if (!"RESET_PASSWORD".equals(vt.getType())) {
            throw new IllegalArgumentException("Invalid token type");
        }

        vt.setUsed(true);
        verificationTokenRepository.save(vt);

        User user = userRepository.findById(vt.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    public AuthTokens refresh(String refreshToken) {
        Claims claims = jwtTokenProvider.validateRefreshToken(refreshToken);
        return refreshFromClaims(claims);
    }

    private AuthTokens refreshFromClaims(Claims claims) {
        String userId = claims.getSubject();
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return buildTokens(user);
    }

    private AuthTokens buildTokens(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId().toString());

        return new AuthTokens(accessToken, refreshToken,
                user.getId().toString(), user.getUsername(), user.getRole());
    }

    @Transactional
    public void resendVerification(String userId) {
        User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.isEmailVerified()) {
            throw new IllegalStateException("Email is already verified");
        }
        sendVerificationEmail(user);
    }

    private void sendVerificationEmail(User user) {
        verificationTokenRepository.deleteByUserId(user.getId());

        String token = generateToken();
        EmailVerificationToken vt = new EmailVerificationToken();
        vt.setUserId(user.getId());
        vt.setEmail(user.getEmail());
        vt.setToken(token);
        vt.setType("VERIFY_EMAIL");
        vt.setExpiresAt(Instant.now().plusSeconds(verificationTokenExpiryHours * 3600));
        verificationTokenRepository.save(vt);

        boolean sent = emailService.sendVerificationEmail(user.getEmail(), token).join();
        if (!sent) {
            throw new IllegalArgumentException("Failed to send verification email. Please check your email configuration.");
        }
    }

    private String generateToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
