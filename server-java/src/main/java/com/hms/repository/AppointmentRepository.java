package com.hms.repository;

import com.hms.model.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    long countByPatientAndStatus(String patientId, String status);

    long countByDoctorAndStatus(String doctorId, String status);

    List<Appointment> findByPatientOrderByDateDescTimeDesc(String patientId);

    List<Appointment> findByDoctorAndDate(String doctorId, String date);

    List<Appointment> findByDoctorAndDateAndStatus(String doctorId, String date, String status);
}
