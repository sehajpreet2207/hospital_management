package com.hms.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

/**
 * Represents a doctor in the hospital.
 * Maps to the "doctors" MongoDB collection.
 *
 * Key fields for appointment scheduling:
 *   - days      : which days of the week the doctor holds OP (e.g., ["Mon", "Tue", "Wed"])
 *   - startTime : when OP starts (e.g., "09:00")
 *   - endTime   : when OP ends   (e.g., "13:00")
 *   - available : if false, no appointments can be booked with this doctor
 *   - fee       : consultation fee in rupees — used to auto-create the billing entry
 *
 * This model is used in Phase 1 only to support the GET /auth/me response.
 * Full CRUD and slot logic is implemented in Phase 3.
 */
@Document(collection = "doctors")
public class Doctor {

    @Id
    @JsonProperty("_id")
    private String id;

    /** Human-readable ID: D001, D002, etc. */
    private String doctorId;

    /** ObjectId string of the linked User account. */
    private String user;

    private String name;
    private String specialization;
    private String qualification;
    private Integer experience;
    private String phone;
    private String email;
    private Double fee;

    /** Days the doctor is available: ["Mon", "Tue", "Wed", "Thu", "Fri"] */
    private List<String> days;

    /** OP start time as "HH:MM", e.g., "09:00" */
    private String startTime;

    /** OP end time as "HH:MM", e.g., "13:00" */
    private String endTime;

    /** Whether this doctor is accepting appointments */
    private boolean available = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // ---------------------------------------------------------------
    // Constructors
    // ---------------------------------------------------------------

    public Doctor() {}

    // ---------------------------------------------------------------
    // Getters and Setters
    // ---------------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDoctorId() { return doctorId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getQualification() { return qualification; }
    public void setQualification(String qualification) { this.qualification = qualification; }

    public Integer getExperience() { return experience; }
    public void setExperience(Integer experience) { this.experience = experience; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Double getFee() { return fee; }
    public void setFee(Double fee) { this.fee = fee; }

    public List<String> getDays() { return days; }
    public void setDays(List<String> days) { this.days = days; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
