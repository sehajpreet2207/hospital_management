package com.hms.controller;

import com.hms.dto.MessageResponse;
import com.hms.dto.PatientFileResponse;
import com.hms.dto.PatientRequest;
import com.hms.model.Patient;
import com.hms.security.UserPrincipal;
import com.hms.service.PatientService;
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
 * REST Controller for patient management under /api/patients.
 * Direct replacement for `server/routes/patients.js`.
 */
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    /**
     * GET /api/patients
     * Search and list patients. Restricted to staff (admin, receptionist, doctor).
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('admin', 'receptionist', 'doctor')")
    public ResponseEntity<List<Patient>> getPatients(@RequestParam(value = "q", required = false) String query) {
        List<Patient> patients = patientService.getPatients(query);
        return ResponseEntity.ok(patients);
    }

    /**
     * GET /api/patients/{id}
     * Returns full patient file: details + appointments + records + bills.
     * Special case: {id} can be "me" for logged-in patient.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PatientFileResponse> getPatientFile(
            @PathVariable("id") String id,
            @AuthenticationPrincipal UserPrincipal principal) {
        PatientFileResponse response = patientService.getPatientFile(id, principal);
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/patients
     * Creates a new patient record (admin and receptionist).
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('admin', 'receptionist')")
    public ResponseEntity<Patient> createPatient(@RequestBody PatientRequest req) {
        Patient patient = patientService.createPatient(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(patient);
    }

    /**
     * PUT /api/patients/{id}
     * Updates an existing patient record. Patients can update their own file;
     * admin/receptionist can update any patient.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Patient> updatePatient(
            @PathVariable("id") String id,
            @RequestBody PatientRequest req,
            @AuthenticationPrincipal UserPrincipal principal) {
        Patient patient = patientService.updatePatient(id, req, principal);
        return ResponseEntity.ok(patient);
    }

    /**
     * DELETE /api/patients/{id}
     * Removes a patient (admin only). Blocked if patient has scheduled appointments.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('admin')")
    public ResponseEntity<MessageResponse> deletePatient(@PathVariable("id") String id) {
        MessageResponse response = patientService.deletePatient(id);
        return ResponseEntity.ok(response);
    }
}
