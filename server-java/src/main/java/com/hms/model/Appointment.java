package com.hms.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents an appointment between a patient and a doctor.
 * Maps to the "appointments" MongoDB collection.
 *
 * Notice the @CompoundIndex:
 * We enforce a partial unique index on { doctor: 1, date: 1, time: 1 }
 * where status = 'Scheduled'. This guarantees at the database level that
 * two patients cannot book the same doctor at the same date and time slot,
 * exactly matching the Mongoose index in server/models/Appointment.js!
 */
@Document(collection = "appointments")
@CompoundIndex(
        name = "doctor_date_time_scheduled_idx",
        def = "{'doctor': 1, 'date': 1, 'time': 1}",
        unique = true,
        partialFilter = "{'status': 'Scheduled'}"
)
public class Appointment {

    @Id
    @JsonProperty("_id")
    private String id;

    /** ObjectId string of the Patient */
    private String patient;

    /** ObjectId string of the Doctor */
    private String doctor;

    /** Appointment date in "YYYY-MM-DD" format */
    private String date;

    /** Appointment slot time in "HH:MM" format (e.g., "09:20") */
    private String time;

    private String reason;

    /** Status: "Scheduled", "Completed", or "Cancelled" */
    private String status = "Scheduled";

    /** ObjectId string of the User who booked the appointment */
    private String bookedBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    public Appointment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatient() { return patient; }
    public void setPatient(String patient) { this.patient = patient; }

    public String getDoctor() { return doctor; }
    public void setDoctor(String doctor) { this.doctor = doctor; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getBookedBy() { return bookedBy; }
    public void setBookedBy(String bookedBy) { this.bookedBy = bookedBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
