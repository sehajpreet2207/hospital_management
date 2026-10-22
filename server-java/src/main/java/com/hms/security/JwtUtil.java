package com.hms.security;

import com.hms.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility for creating and validating JSON Web Tokens (JWT).
 * Uses JJWT 0.12 library.
 *
 * Replaces the 'jsonwebtoken' Node.js library:
 *   Node: jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '7d' })
 */
@Component
public class JwtUtil {

    private final String secret;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret:hms-dev-secret-key-32chars-minimum-change-in-prod}") String secret,
            @Value("${jwt.expiration-ms:604800000}") long expirationMs) {
        this.secret = secret;
        this.expirationMs = expirationMs;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT with "id" and "role" claims matching Node.js backend.
     */
    public String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(user.getId())
                .claim("id", user.getId())
                .claim("role", user.getRole())
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Parses and returns the claims from a token.
     * Throws JwtException if the token is invalid or expired.
     */
    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Extracts the user id from the token.
     */
    public String getUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        String id = claims.get("id", String.class);
        return (id != null) ? id : claims.getSubject();
    }

    /**
     * Checks if a token is valid and not expired.
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
