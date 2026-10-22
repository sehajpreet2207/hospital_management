package com.hms.repository;

import com.hms.model.Patient;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for Patient documents.
 */
@Repository
public interface PatientRepository extends MongoRepository<Patient, String> {

    Optional<Patient> findByUser(String userId);

    Optional<Patient> findByEmailAndUserIsNull(String email);

    Optional<Patient> findByPatientId(String patientId);
}
