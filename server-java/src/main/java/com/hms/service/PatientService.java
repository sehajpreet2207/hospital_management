package com.hms.service;

import com.hms.dto.DoctorSummary;
import com.hms.dto.MessageResponse;
import com.hms.dto.PatientFileResponse;
import com.hms.dto.PatientRequest;
import com.hms.dto.PopulatedAppointment;
import com.hms.dto.PopulatedMedicalRecord;
import com.hms.exception.BadRequestException;
import com.hms.exception.ForbiddenException;
import com.hms.exception.ResourceNotFoundException;
import com.hms.model.Appointment;
import com.hms.model.Bill;
import com.hms.model.Doctor;
import com.hms.model.MedicalRecord;
import com.hms.model.Patient;
import com.hms.repository.AppointmentRepository;
import com.hms.repository.BillRepository;
import com.hms.repository.DoctorRepository;
import com.hms.repository.MedicalRecordRepository;
import com.hms.repository.PatientRepository;
import com.hms.security.UserPrincipal;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Service encapsulating patient business logic:
 * - Filtered search by name/patientId/phone/email
 * - Full patient file retrieval with populated appointments, records, and bills
 * - Patient registration with automatic sequential ID (P0001)
 * - Self-edit support and admin/receptionist updates
 * - Deletion guard: blocks deletion if patient has scheduled appointments
 */
@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final MedicalRecordRepository medicalRecordRepository;
    private final BillRepository billRepository;
    private final CounterService counterService;
    private final MongoTemplate mongoTemplate;

    public PatientService(
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            MedicalRecordRepository medicalRecordRepository,
            BillRepository billRepository,
            CounterService counterService,
            MongoTemplate mongoTemplate) {
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.medicalRecordRepository = medicalRecordRepository;
        this.billRepository = billRepository;
        this.counterService = counterService;
        this.mongoTemplate = mongoTemplate;
    }

    /**
     * Lists patients, optionally filtered by a search query matching
     * name, patientId, phone, or email.
     */
    public List<Patient> getPatients(String query) {
        Query q = new Query();
        if (query != null && !query.trim().isEmpty()) {
            String escaped = Pattern.quote(query.trim());
            Criteria criteria = new Criteria().orOperator(
                    Criteria.where("name").regex(escaped, "i"),
                    Criteria.where("patientId").regex(escaped, "i"),
                    Criteria.where("phone").regex(escaped, "i"),
                    Criteria.where("email").regex(escaped, "i")
            );
            q.addCriteria(criteria);
        }
        q.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        return mongoTemplate.find(q, Patient.class);
    }

    /**
     * Returns the full patient file: details + appointments + medical history + bills.
     * Enforces role scoping: patients can only access their own record.
     */
    public PatientFileResponse getPatientFile(String idOrMe, UserPrincipal currentUser) {
        String patientId;

        if ("me".equalsIgnoreCase(idOrMe)) {
            Patient self = patientRepository.findByUser(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
            patientId = self.getId();
        } else {
            patientId = idOrMe;
        }

        // Role check: patients can only view their own file
        if ("patient".equalsIgnoreCase(currentUser.getRole())) {
            Optional<Patient> self = patientRepository.findByUser(currentUser.getId());
            if (self.isEmpty() || !Objects.equals(self.get().getId(), patientId)) {
                throw new ForbiddenException("You can only view your own file");
            }
        }

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<Appointment> appointments = appointmentRepository.findByPatientOrderByDateDescTimeDesc(patientId);
        List<MedicalRecord> records = medicalRecordRepository.findByPatientOrderByVisitDateDesc(patientId);
        List<Bill> bills = billRepository.findByPatientOrderByCreatedAtDesc(patientId);

        // Collect all doctor IDs referenced in appointments and records to populate doctor info
        Set<String> doctorIds = new HashSet<>();
        appointments.forEach(a -> { if (a.getDoctor() != null) doctorIds.add(a.getDoctor()); });
        records.forEach(r -> { if (r.getDoctor() != null) doctorIds.add(r.getDoctor()); });

        Map<String, DoctorSummary> doctorMap = doctorIds.isEmpty() ? Collections.emptyMap() :
                doctorRepository.findAllById(doctorIds).stream()
                        .collect(Collectors.toMap(Doctor::getId, DoctorSummary::from));

        List<PopulatedAppointment> populatedAppointments = appointments.stream()
                .map(a -> new PopulatedAppointment(a, doctorMap.get(a.getDoctor())))
                .collect(Collectors.toList());

        List<PopulatedMedicalRecord> populatedRecords = records.stream()
                .map(r -> new PopulatedMedicalRecord(r, doctorMap.get(r.getDoctor())))
                .collect(Collectors.toList());

        return new PatientFileResponse(patient, populatedAppointments, populatedRecords, bills);
    }

    /**
     * Creates a new patient record (admin and receptionist).
     */
    public Patient createPatient(PatientRequest req) {
        if (req == null || req.getName() == null || req.getName().isBlank()
                || req.getGender() == null || req.getGender().isBlank()
                || req.getPhone() == null || req.getPhone().isBlank()) {
            throw new BadRequestException("Name, gender, and phone are required");
        }

        Patient patient = new Patient();
        patient.setPatientId(counterService.nextCode("patient", "P", 4));
        patient.setName(req.getName().trim());
        patient.setGender(req.getGender().trim());
        patient.setPhone(req.getPhone().trim());
        patient.setDob(req.getDob());
        patient.setEmail(req.getEmail() != null ? req.getEmail().trim().toLowerCase() : null);
        patient.setAddress(req.getAddress());
        patient.setBloodGroup(req.getBloodGroup());
        patient.setEmergencyContact(req.getEmergencyContact());
        patient.setAllergies(req.getAllergies());

        return patientRepository.save(patient);
    }

    /**
     * Updates an existing patient record.
     * Patients can update their own details; admin/receptionist can update any patient.
     */
    public Patient updatePatient(String idOrMe, PatientRequest req, UserPrincipal currentUser) {
        Patient patient;

        if ("me".equalsIgnoreCase(idOrMe)) {
            patient = patientRepository.findByUser(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        } else {
            patient = patientRepository.findById(idOrMe)
                    .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        }

        boolean isSelf = "patient".equalsIgnoreCase(currentUser.getRole())
                && Objects.equals(patient.getUser(), currentUser.getId());

        if (!isSelf && !List.of("admin", "receptionist").contains(currentUser.getRole())) {
            throw new ForbiddenException("You do not have access to this action");
        }

        // Apply allowed updates (never overwrite patientId or user)
        if (req.getName() != null && !req.getName().isBlank()) patient.setName(req.getName().trim());
        if (req.getGender() != null) patient.setGender(req.getGender().trim());
        if (req.getDob() != null) patient.setDob(req.getDob());
        if (req.getPhone() != null && !req.getPhone().isBlank()) patient.setPhone(req.getPhone().trim());
        if (req.getEmail() != null) patient.setEmail(req.getEmail().trim().toLowerCase());
        if (req.getAddress() != null) patient.setAddress(req.getAddress());
        if (req.getBloodGroup() != null) patient.setBloodGroup(req.getBloodGroup());
        if (req.getEmergencyContact() != null) patient.setEmergencyContact(req.getEmergencyContact());
        if (req.getAllergies() != null) patient.setAllergies(req.getAllergies());

        return patientRepository.save(patient);
    }

    /**
     * Deletes a patient (admin only).
     * Business rule guard: blocked if the patient has scheduled appointments.
     */
    public MessageResponse deletePatient(String patientId) {
        long open = appointmentRepository.countByPatientAndStatus(patientId, "Scheduled");
        if (open > 0) {
            throw new BadRequestException("Patient has upcoming appointments. Cancel them first.");
        }

        patientRepository.deleteById(patientId);
        return new MessageResponse("Patient removed");
    }
}
