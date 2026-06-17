package com.community.auth;

import com.community.auth.dto.*;
import com.community.user.User;
import com.community.user.UserRepository;
import com.community.user.dto.UserResponse;
import com.community.user.UserService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

// WHY: JWT tokens are set as HttpOnly cookies on login/register/refresh.
// This prevents XSS attacks — JavaScript cannot read HttpOnly cookies.
// Access token: 15min expiry. Refresh token: 7 day expiry.
// The /api/auth/me endpoint lets the frontend check auth state without token storage.

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final TwoFactorService twoFactorService;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final boolean secureCookies;

    public AuthController(AuthService authService, UserService userService, 
                          TwoFactorService twoFactorService, UserRepository userRepository,
                          JwtTokenProvider jwtTokenProvider,
                          @Value("${app.cookies.secure}") boolean secureCookies) {
        this.authService = authService;
        this.userService = userService;
        this.twoFactorService = twoFactorService;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.secureCookies = secureCookies;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthTokens tokens = authService.register(request);
        setAuthCookies(response, tokens);
        return ResponseEntity.ok(new AuthResponse(tokens.userId(), tokens.username(), tokens.role()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        LoginResult result = authService.login(request);
        if (result.requires2fa()) {
            return ResponseEntity.ok(new LoginResponse(null, null, null, true, result.tempToken()));
        }
        setAuthCookies(response, result.tokens());
        return ResponseEntity.ok(new LoginResponse(result.tokens().userId(), result.tokens().username(), result.tokens().role(), false, null));
    }

    @PostMapping("/login/verify")
    public ResponseEntity<AuthResponse> verifyLogin(
            @Valid @RequestBody VerifyTwoFactorRequest request,
            HttpServletResponse response) {
        
        Claims claims = jwtTokenProvider.validateAccessToken(request.tempToken());
        if (!"TEMP_2FA".equals(claims.get("role"))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findById(UUID.fromString(claims.getSubject()))
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!twoFactorService.isOtpValid(user.getTotpSecret(), request.code())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId().toString(), user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId().toString());

        AuthTokens tokens = new AuthTokens(accessToken, refreshToken, user.getId().toString(), user.getUsername(), user.getRole());
        setAuthCookies(response, tokens);
        return ResponseEntity.ok(new AuthResponse(tokens.userId(), tokens.username(), tokens.role()));
    }

    @GetMapping("/2fa/generate")
    public ResponseEntity<GenerateTwoFactorResponse> generate2fa(@AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        User user = userRepository.findById(UUID.fromString(principal.userId())).orElseThrow();
        
        String secret = twoFactorService.generateSecret();
        String qrCode = twoFactorService.generateQrCodeImageUri(secret, user.getUsername());
        
        return ResponseEntity.ok(new GenerateTwoFactorResponse(qrCode, secret));
    }

    @PostMapping("/2fa/enable")
    public ResponseEntity<Void> enable2fa(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody TwoFactorCodeRequest request) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        User user = userRepository.findById(UUID.fromString(principal.userId())).orElseThrow();

        if (twoFactorService.isOtpValid(request.secret(), request.code())) {
            user.setTotpSecret(request.secret());
            user.setTotpEnabled(true);
            userRepository.save(user);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    @PostMapping("/2fa/disable")
    public ResponseEntity<Void> disable2fa(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody TwoFactorCodeRequest request) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        User user = userRepository.findById(UUID.fromString(principal.userId())).orElseThrow();

        if (twoFactorService.isOtpValid(user.getTotpSecret(), request.code())) {
            user.setTotpSecret(null);
            user.setTotpEnabled(false);
            userRepository.save(user);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @Valid @RequestBody(required = false) RefreshTokenRequest body,
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = null;

        if (body != null && body.refreshToken() != null) {
            refreshToken = body.refreshToken();
        } else if (request.getCookies() != null) {
            refreshToken = java.util.Arrays.stream(request.getCookies())
                    .filter(c -> "refresh_token".equals(c.getName()))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);
        }

        if (refreshToken == null) {
            throw new IllegalArgumentException("Refresh token is missing");
        }

        AuthTokens tokens = authService.refresh(refreshToken);
        setAuthCookies(response, tokens);
        return ResponseEntity.ok(new AuthResponse(tokens.userId(), tokens.username(), tokens.role()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(userService.getProfile(principal));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.changePassword(principal.userId(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/username")
    public ResponseEntity<Void> changeUsername(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody UpdateUsernameRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.changeUsername(principal.userId(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/email")
    public ResponseEntity<Void> changeEmail(
            @AuthenticationPrincipal AuthPrincipal principal,
            @Valid @RequestBody UpdateEmailRequest request) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.changeEmail(principal.userId(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(
            @AuthenticationPrincipal AuthPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.resendVerification(principal.userId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/token")
    public ResponseEntity<Map<String, String>> getToken(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = java.util.Arrays.stream(request.getCookies())
                .filter(c -> "access_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
        if (token == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(Map.of("token", token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearAuthCookies(response);
        return ResponseEntity.ok().build();
    }

    private void setAuthCookies(HttpServletResponse response, AuthTokens tokens) {
        var accessCookie = new jakarta.servlet.http.Cookie("access_token", tokens.accessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(this.secureCookies);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(900);
        accessCookie.setAttribute("SameSite", "Lax");
        response.addCookie(accessCookie);

        var refreshCookie = new jakarta.servlet.http.Cookie("refresh_token", tokens.refreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(this.secureCookies);
        refreshCookie.setPath("/api/auth");
        refreshCookie.setMaxAge(604800);
        refreshCookie.setAttribute("SameSite", "Lax");
        response.addCookie(refreshCookie);
    }

    private void clearAuthCookies(HttpServletResponse response) {
        var accessCookie = new jakarta.servlet.http.Cookie("access_token", null);
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(this.secureCookies);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);
        response.addCookie(accessCookie);

        var refreshCookie = new jakarta.servlet.http.Cookie("refresh_token", null);
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(this.secureCookies);
        refreshCookie.setPath("/api/auth");
        refreshCookie.setMaxAge(0);
        response.addCookie(refreshCookie);
    }
}
