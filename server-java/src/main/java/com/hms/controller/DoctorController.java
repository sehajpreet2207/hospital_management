package com.hms.controller;

import com.hms.dto.DoctorRequest;
import com.hms.dto.DoctorSlotsResponse;
import com.hms.dto.MessageResponse;
import com.hms.model.Doctor;
import com.hms.security.UserPrincipal;
import com.hms.service.DoctorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller handling doctor management and OP slot queries under /api/doctors.
 * Direct replacement for `server/routes/doctors.js`.
 */
@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    /**
     * GET /api/doctors
     * Lists doctors, optionally filtered by specialization.
     * Patients only see available=true doctors.
     */
    @GetMapping
    public ResponseEntity<List<Doctor>> getDoctors(
            @RequestParam(value = "specialization", required = false) String specialization,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Doctor> doctors = doctorService.getDoctors(specialization, principal);
        return ResponseEntity.ok(doctors);
    }

    /**
     * GET /api/doctors/{id}
     * Returns a single doctor by MongoDB ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Doctor> getDoctorById(@PathVariable("id") String id) {
        Doctor doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(doctor);
    }

    /**
     * GET /api/doctors/{id}/slots?date=YYYY-MM-DD
     * Returns available and booked 20-minute OP slots for a doctor on a given date.
     */
    @GetMapping("/{id}/slots")
    public ResponseEntity<DoctorSlotsResponse> getDoctorSlots(
            @PathVariable("id") String id,
            @RequestParam("date") String date) {
        DoctorSlotsResponse response = doctorService.getDoctorSlots(id, date);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/doctors
     * Adds a new doctor (admin only).
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('admin')")
    public ResponseEntity<Doctor> createDoctor(@RequestBody DoctorRequest req) {
        Doctor doctor = doctorService.createDoctor(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(doctor);
    }

    /**
     * PUT /api/doctors/{id}
     * Updates doctor profile. Admin can edit everything; doctors can only edit
     * their own schedule, phone, and availability.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Doctor> updateDoctor(
            @PathVariable("id") String id,
            @RequestBody DoctorRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        Doctor doctor = doctorService.updateDoctor(id, req, principal);
        return ResponseEntity.ok(doctor);
    }

    /**
     * DELETE /api/doctors/{id}
     * Removes a doctor (admin only). Blocked if upcoming appointments exist.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('admin')")
    public ResponseEntity<MessageResponse> deleteDoctor(@PathVariable("id") String id) {
        MessageResponse response = doctorService.deleteDoctor(id);
        return ResponseEntity.ok(response);
    }
}
