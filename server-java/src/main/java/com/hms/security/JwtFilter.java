package com.hms.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.model.User;
import com.hms.repository.UserRepository;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

/**
 * Filter that intercepts incoming HTTP requests to validate JWT Bearer tokens.
 *
 * Equivalent to Node.js `protect` middleware in `middleware/auth.js`.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public JwtFilter(JwtUtil jwtUtil, UserRepository userRepository, ObjectMapper objectMapper) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);

            try {
                String userId = jwtUtil.getUserIdFromToken(token);

                Optional<User> userOpt = userRepository.findById(userId);
                if (userOpt.isEmpty() || !userOpt.get().isActive()) {
                    writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Account not found or disabled");
                    return;
                }

                User user = userOpt.get();
                UserPrincipal principal = new UserPrincipal(user);
                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(auth);

            } catch (ExpiredJwtException e) {
                writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Session expired, please log in again");
                return;
            } catch (JwtException e) {
                writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Session expired, please log in again");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), Collections.singletonMap("message", message));
    }
}
