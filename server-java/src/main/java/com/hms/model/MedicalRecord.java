package com.hms.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a doctor consultation / medical record for a patient visit.
 * Maps to the "medicalrecords" MongoDB collection.
 */
@Document(collection = "medicalrecords")
public class MedicalRecord {

    @Id
    @JsonProperty("_id")
    private String id;

    private String patient;
    private String doctor;
    private String appointment;
    private Instant visitDate = Instant.now();
    private String symptoms;
    private String diagnosis;
    private String treatment;
    private Vitals vitals = new Vitals();
    private List<Prescription> prescriptions = new ArrayList<>();
    private String notes;
    private boolean dispensed = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // ---------------------------------------------------------------
    // Embedded sub-documents: Vitals and Prescription
    // ---------------------------------------------------------------

    public static class Vitals {
        private String bp;
        private String pulse;
        private String temperature;
        private String weight;

        public Vitals() {}

        public String getBp() { return bp; }
        public void setBp(String bp) { this.bp = bp; }

        public String getPulse() { return pulse; }
        public void setPulse(String pulse) { this.pulse = pulse; }

        public String getTemperature() { return temperature; }
        public void setTemperature(String temperature) { this.temperature = temperature; }

        public String getWeight() { return weight; }
        public void setWeight(String weight) { this.weight = weight; }
    }

    public static class Prescription {
        private String medicine; // ObjectId of Medicine
        private String name;     // Medicine name
        private String dosage;   // e.g., "1-0-1"
        private Integer days;
        private Integer quantity = 1;

        public Prescription() {}

        public String getMedicine() { return medicine; }
        public void setMedicine(String medicine) { this.medicine = medicine; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getDosage() { return dosage; }
        public void setDosage(String dosage) { this.dosage = dosage; }

        public Integer getDays() { return days; }
        public void setDays(Integer days) { this.days = days; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public MedicalRecord() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatient() { return patient; }
    public void setPatient(String patient) { this.patient = patient; }

    public String getDoctor() { return doctor; }
    public void setDoctor(String doctor) { this.doctor = doctor; }

    public String getAppointment() { return appointment; }
    public void setAppointment(String appointment) { this.appointment = appointment; }

    public Instant getVisitDate() { return visitDate; }
    public void setVisitDate(Instant visitDate) { this.visitDate = visitDate; }

    public String getSymptoms() { return symptoms; }
    public void setSymptoms(String symptoms) { this.symptoms = symptoms; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getTreatment() { return treatment; }
    public void setTreatment(String treatment) { this.treatment = treatment; }

    public Vitals getVitals() { return vitals; }
    public void setVitals(Vitals vitals) { this.vitals = vitals; }

    public List<Prescription> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<Prescription> prescriptions) { this.prescriptions = prescriptions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isDispensed() { return dispensed; }
    public void setDispensed(boolean dispensed) { this.dispensed = dispensed; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
