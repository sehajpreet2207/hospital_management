package com.hms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hms.model.Appointment;

import java.time.Instant;

public class PopulatedAppointment {

    @JsonProperty("_id")
    private String id;
    private String patient;
    private DoctorSummary doctor;
    private String date;
    private String time;
    private String reason;
    private String status;
    private String bookedBy;
    private Instant createdAt;
    private Instant updatedAt;

    public PopulatedAppointment() {}

    public PopulatedAppointment(Appointment a, DoctorSummary docSummary) {
        if (a != null) {
            this.id = a.getId();
            this.patient = a.getPatient();
            this.doctor = docSummary;
            this.date = a.getDate();
            this.time = a.getTime();
            this.reason = a.getReason();
            this.status = a.getStatus();
            this.bookedBy = a.getBookedBy();
            this.createdAt = a.getCreatedAt();
            this.updatedAt = a.getUpdatedAt();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatient() { return patient; }
    public void setPatient(String patient) { this.patient = patient; }

    public DoctorSummary getDoctor() { return doctor; }
    public void setDoctor(DoctorSummary doctor) { this.doctor = doctor; }

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
