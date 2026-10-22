package com.hms.controller;

import com.hms.dto.AuthResponse;
import com.hms.dto.LoginRequest;
import com.hms.dto.MeResponse;
import com.hms.dto.MessageResponse;
import com.hms.dto.PasswordChangeRequest;
import com.hms.dto.RegisterRequest;
import com.hms.security.UserPrincipal;
import com.hms.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller handling authentication endpoints under /api/auth.
 *
 * Direct replacement for `server/routes/auth.js`.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/login
     * Authenticates user and returns JWT token + user summary.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest req) {
        AuthResponse response = authService.login(req);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/register
     * Registers a new patient account with HTTP 201 Created.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
        AuthResponse response = authService.register(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/auth/me
     * Returns current user profile with linked doctor/patient records.
     */
    @GetMapping("/me")
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        MeResponse response = authService.getMe(principal.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * PUT /api/auth/password
     * Updates current user's password.
     */
    @PutMapping("/password")
    public ResponseEntity<MessageResponse> updatePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody PasswordChangeRequest req) {
        MessageResponse response = authService.changePassword(principal.getId(), req);
        return ResponseEntity.ok(response);
    }
}
