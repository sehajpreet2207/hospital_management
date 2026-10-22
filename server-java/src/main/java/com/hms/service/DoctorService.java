package com.hms.service;

import com.hms.dto.DoctorRequest;
import com.hms.dto.DoctorSlotsResponse;
import com.hms.dto.MessageResponse;
import com.hms.dto.SlotItem;
import com.hms.exception.BadRequestException;
import com.hms.exception.ConflictException;
import com.hms.exception.ForbiddenException;
import com.hms.exception.ResourceNotFoundException;
import com.hms.model.Appointment;
import com.hms.model.Doctor;
import com.hms.model.User;
import com.hms.repository.AppointmentRepository;
import com.hms.repository.DoctorRepository;
import com.hms.repository.UserRepository;
import com.hms.security.UserPrincipal;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service encapsulating Doctor business logic:
 * - Filtered search by specialization
 * - Patient visibility scoping (patients only see available=true doctors)
 * - 20-minute OP slot calculation algorithm
 * - Doctor creation with optional linked User login
 * - Role-scoped updates (doctors can only edit their own schedule/phone/availability)
 * - Deletion guard checking upcoming scheduled appointments and user deactivation
 */
@Service
public class DoctorService {

    private static final int SLOT_MINUTES = 20;
    private static final String[] DAY_NAMES = {"Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"};

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final CounterService counterService;
    private final PasswordEncoder passwordEncoder;
    private final MongoTemplate mongoTemplate;

    public DoctorService(
            DoctorRepository doctorRepository,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository,
            CounterService counterService,
            PasswordEncoder passwordEncoder,
            MongoTemplate mongoTemplate) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
        this.counterService = counterService;
        this.passwordEncoder = passwordEncoder;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Lists doctors, optionally filtered by specialization.
     * Scoping rule: patients can only see doctors who are currently available.
     */
    public List<Doctor> getDoctors(String specialization, UserPrincipal currentUser) {
        Query q = new Query();

        if (specialization != null && !specialization.trim().isEmpty()) {
            q.addCriteria(Criteria.where("specialization").is(specialization.trim()));
        }

        if (currentUser != null && "patient".equalsIgnoreCase(currentUser.getRole())) {
            q.addCriteria(Criteria.where("available").is(true));
        }

        q.with(Sort.by(Sort.Direction.ASC, "name"));
        return mongoTemplate.find(q, Doctor.class);
    }

    /**
     * Finds a single doctor by MongoDB ID.
     */
    public Doctor getDoctorById(String id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
    }

    /**
     * Calculates free and booked 20-minute OP slots for a doctor on a given date (YYYY-MM-DD).
     */
    public DoctorSlotsResponse getDoctorSlots(String id, String dateStr) {
        if (dateStr == null || !dateStr.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            throw new BadRequestException("Pick a valid date");
        }

        Doctor doctor = getDoctorById(id);

        LocalDate targetDate = LocalDate.parse(dateStr);
        String day = DAY_NAMES[targetDate.getDayOfWeek().getValue() % 7];

        if (!doctor.isAvailable() || doctor.getDays() == null || !doctor.getDays().contains(day)) {
            return new DoctorSlotsResponse(day, Collections.emptyList(), doctor.getName() + " is not available on " + day);
        }

        List<Appointment> bookedAppointments = appointmentRepository.findByDoctorAndDateAndStatus(
                doctor.getId(), dateStr, "Scheduled");
        Set<String> bookedTimes = bookedAppointments.stream()
                .map(Appointment::getTime)
                .collect(Collectors.toSet());

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        int nowMin = now.getHour() * 60 + now.getMinute();

        int startMin = toMin(doctor.getStartTime() != null ? doctor.getStartTime() : "09:00");
        int endMin = toMin(doctor.getEndTime() != null ? doctor.getEndTime() : "13:00");

        List<SlotItem> slots = new ArrayList<>();
        for (int m = startMin; m + SLOT_MINUTES <= endMin; m += SLOT_MINUTES) {
            String t = toTime(m);
            boolean past = targetDate.isBefore(today) || (targetDate.isEqual(today) && m <= nowMin);
            boolean free = !bookedTimes.contains(t) && !past;
            slots.add(new SlotItem(t, free));
        }

        return new DoctorSlotsResponse(day, slots);
    }

    /**
     * Creates a new doctor record (admin only).
     * Optionally creates a linked User login account in the same step.
     */
    public Doctor createDoctor(DoctorRequest req) {
        if (req == null || req.getName() == null || req.getName().isBlank()
                || req.getSpecialization() == null || req.getSpecialization().isBlank()) {
            throw new BadRequestException("Name and specialization are required");
        }

        Doctor doctor = new Doctor();
        doctor.setDoctorId(counterService.nextCode("doctor", "D", 3));
        doctor.setName(req.getName().trim());
        doctor.setSpecialization(req.getSpecialization().trim());
        doctor.setQualification(req.getQualification());
        doctor.setExperience(req.getExperience() != null ? req.getExperience() : 0);
        doctor.setPhone(req.getPhone());
        doctor.setEmail(req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null);
        doctor.setFee(req.getFee() != null ? req.getFee() : 300.0);
        doctor.setDays(req.getDays() != null && !req.getDays().isEmpty() ? req.getDays() : List.of("Mon", "Tue", "Wed", "Thu", "Fri"));
        doctor.setStartTime(req.getStartTime() != null ? req.getStartTime() : "09:00");
        doctor.setEndTime(req.getEndTime() != null ? req.getEndTime() : "13:00");
        doctor.setAvailable(req.getAvailable() != null ? req.getAvailable() : true);

        // Optional login account creation
        if (req.getLoginPassword() != null && !req.getLoginPassword().isBlank()) {
            if (req.getEmail() == null || req.getEmail().isBlank()) {
                throw new BadRequestException("Email is needed to create a login");
            }
            String email = req.getEmail().trim().toLowerCase();
            if (userRepository.existsByEmail(email)) {
                throw new ConflictException("A login with this email already exists");
            }

            User user = new User();
            user.setName(doctor.getName());
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(req.getLoginPassword()));
            user.setRole("doctor");
            user.setActive(true);
            user = userRepository.save(user);

            doctor.setUser(user.getId());
        }

        return doctorRepository.save(doctor);
    }

    /**
     * Updates an existing doctor profile.
     * Admin can update all fields; a doctor editing themself can only change:
     * days, startTime, endTime, available, phone.
     */
    public Doctor updateDoctor(String id, DoctorRequest req, UserPrincipal currentUser) {
        Doctor doctor = getDoctorById(id);

        boolean isSelf = "doctor".equalsIgnoreCase(currentUser.getRole())
                && Objects.equals(doctor.getUser(), currentUser.getId());

        if (!"admin".equalsIgnoreCase(currentUser.getRole()) && !isSelf) {
            throw new ForbiddenException("You do not have access to this action");
        }

        // Apply updates
        if (isSelf && !"admin".equalsIgnoreCase(currentUser.getRole())) {
            // Self-edit: restricted fields only
            if (req.getDays() != null) doctor.setDays(req.getDays());
            if (req.getStartTime() != null) doctor.setStartTime(req.getStartTime());
            if (req.getEndTime() != null) doctor.setEndTime(req.getEndTime());
            if (req.getAvailable() != null) doctor.setAvailable(req.getAvailable());
            if (req.getPhone() != null) doctor.setPhone(req.getPhone());
        } else {
            // Admin edit: can update everything
            if (req.getName() != null && !req.getName().isBlank()) doctor.setName(req.getName().trim());
            if (req.getSpecialization() != null) doctor.setSpecialization(req.getSpecialization().trim());
            if (req.getQualification() != null) doctor.setQualification(req.getQualification());
            if (req.getExperience() != null) doctor.setExperience(req.getExperience());
            if (req.getPhone() != null) doctor.setPhone(req.getPhone());
            if (req.getEmail() != null) doctor.setEmail(req.getEmail().trim().toLowerCase());
            if (req.getFee() != null) doctor.setFee(req.getFee());
            if (req.getDays() != null) doctor.setDays(req.getDays());
            if (req.getStartTime() != null) doctor.setStartTime(req.getStartTime());
            if (req.getEndTime() != null) doctor.setEndTime(req.getEndTime());
            if (req.getAvailable() != null) doctor.setAvailable(req.getAvailable());
        }

        return doctorRepository.save(doctor);
    }

    /**
     * Deletes a doctor (admin only).
     * Guard: blocked if doctor has upcoming scheduled appointments.
     * Also deactivates the linked User account if present.
     */
    public MessageResponse deleteDoctor(String id) {
        long open = appointmentRepository.countByDoctorAndStatus(id, "Scheduled");
        if (open > 0) {
            throw new BadRequestException("Doctor has upcoming appointments. Reassign or cancel them first.");
        }

        Doctor doctor = getDoctorById(id);

        if (doctor.getUser() != null) {
            userRepository.findById(doctor.getUser()).ifPresent(user -> {
                user.setActive(false);
                userRepository.save(user);
            });
        }

        doctorRepository.deleteById(id);
        return new MessageResponse("Doctor removed");
    }

    private int toMin(String time) {
        if (time == null || !time.contains(":")) return 0;
        String[] parts = time.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }

    private String toTime(int minutes) {
        int h = minutes / 60;
        int m = minutes % 60;
        return String.format("%02d:%02d", h, m);
    }
}
