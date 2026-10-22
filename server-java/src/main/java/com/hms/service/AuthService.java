package com.hms.service;

import com.hms.dto.AuthResponse;
import com.hms.dto.LoginRequest;
import com.hms.dto.MeResponse;
import com.hms.dto.MessageResponse;
import com.hms.dto.PasswordChangeRequest;
import com.hms.dto.PublicUser;
import com.hms.dto.RegisterRequest;
import com.hms.exception.BadRequestException;
import com.hms.exception.ConflictException;
import com.hms.exception.ForbiddenException;
import com.hms.exception.UnauthorizedException;
import com.hms.model.Doctor;
import com.hms.model.Patient;
import com.hms.model.User;
import com.hms.repository.DoctorRepository;
import com.hms.repository.PatientRepository;
import com.hms.repository.UserRepository;
import com.hms.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service encapsulating authentication and account management logic.
 *
 * Direct replacement for `server/routes/auth.js`.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final CounterService counterService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            UserRepository userRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            CounterService counterService,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.counterService = counterService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Authenticates a user by email and password.
     */
    public AuthResponse login(LoginRequest req) {
        if (req == null || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()) {
            throw new BadRequestException("Email and password are required");
        }

        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }

        if (!user.isActive()) {
            throw new ForbiddenException("This account has been disabled");
        }

        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, PublicUser.from(user));
    }

    /**
     * Self-registration for patients.
     * Creates User and links or creates corresponding Patient record.
     */
    public AuthResponse register(RegisterRequest req) {
        if (req == null
                || req.getName() == null || req.getName().isBlank()
                || req.getEmail() == null || req.getEmail().isBlank()
                || req.getPassword() == null || req.getPassword().isBlank()
                || req.getPhone() == null || req.getPhone().isBlank()
                || req.getGender() == null || req.getGender().isBlank()) {
            throw new BadRequestException("Name, email, password, phone and gender are required");
        }

        String email = req.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with this email already exists");
        }

        // 1. Create user account
        User user = new User();
        user.setName(req.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("patient");
        user.setActive(true);
        user = userRepository.save(user);

        // 2. Link existing front desk patient or create a new Patient record
        Optional<Patient> existingPatient = patientRepository.findByEmailAndUserIsNull(email);
        if (existingPatient.isPresent()) {
            Patient patient = existingPatient.get();
            patient.setUser(user.getId());
            patientRepository.save(patient);
        } else {
            Patient newPatient = new Patient();
            newPatient.setUser(user.getId());
            newPatient.setName(req.getName().trim());
            newPatient.setEmail(email);
            newPatient.setPhone(req.getPhone().trim());
            newPatient.setGender(req.getGender().trim());
            newPatient.setDob(req.getDob());
            newPatient.setPatientId(counterService.nextCode("patient", "P", 4));
            patientRepository.save(newPatient);
        }

        String token = jwtUtil.generateToken(user);
        return new AuthResponse(token, PublicUser.from(user));
    }

    /**
     * Returns the currently authenticated user's profile, including
     * linked doctor or patient record if applicable.
     */
    public MeResponse getMe(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Account not found or disabled"));

        Doctor doctor = null;
        Patient patient = null;

        if ("doctor".equalsIgnoreCase(user.getRole())) {
            doctor = doctorRepository.findByUser(userId).orElse(null);
        } else if ("patient".equalsIgnoreCase(user.getRole())) {
            patient = patientRepository.findByUser(userId).orElse(null);
        }

        return new MeResponse(PublicUser.from(user), doctor, patient);
    }

    /**
     * Changes the current user's password.
     */
    public MessageResponse changePassword(String userId, PasswordChangeRequest req) {
        if (req == null) {
            throw new BadRequestException("Current and new password are required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Account not found or disabled"));

        String currentPassword = (req.getCurrentPassword() != null) ? req.getCurrentPassword() : "";
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is wrong");
        }

        String newPassword = req.getNewPassword();
        if (newPassword == null || newPassword.length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return new MessageResponse("Password updated");
    }
}
