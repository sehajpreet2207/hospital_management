package com.hms.repository;

import com.hms.model.Doctor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data MongoDB repository for Doctor documents.
 */
@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {

    Optional<Doctor> findByUser(String userId);

    Optional<Doctor> findByDoctorId(String doctorId);
}
