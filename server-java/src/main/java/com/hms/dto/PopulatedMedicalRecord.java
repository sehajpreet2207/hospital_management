package com.hms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hms.model.MedicalRecord;

import java.time.Instant;
import java.util.List;

public class PopulatedMedicalRecord {

    @JsonProperty("_id")
    private String id;
    private String patient;
    private DoctorSummary doctor;
    private String appointment;
    private Instant visitDate;
    private String symptoms;
    private String diagnosis;
    private String treatment;
    private MedicalRecord.Vitals vitals;
    private List<MedicalRecord.Prescription> prescriptions;
    private String notes;
    private boolean dispensed;
    private Instant createdAt;
    private Instant updatedAt;

    public PopulatedMedicalRecord() {}

    public PopulatedMedicalRecord(MedicalRecord r, DoctorSummary docSummary) {
        if (r != null) {
            this.id = r.getId();
            this.patient = r.getPatient();
            this.doctor = docSummary;
            this.appointment = r.getAppointment();
            this.visitDate = r.getVisitDate();
            this.symptoms = r.getSymptoms();
            this.diagnosis = r.getDiagnosis();
            this.treatment = r.getTreatment();
            this.vitals = r.getVitals();
            this.prescriptions = r.getPrescriptions();
            this.notes = r.getNotes();
            this.dispensed = r.isDispensed();
            this.createdAt = r.getCreatedAt();
            this.updatedAt = r.getUpdatedAt();
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPatient() { return patient; }
    public void setPatient(String patient) { this.patient = patient; }

    public DoctorSummary getDoctor() { return doctor; }
    public void setDoctor(DoctorSummary doctor) { this.doctor = doctor; }

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

    public MedicalRecord.Vitals getVitals() { return vitals; }
    public void setVitals(MedicalRecord.Vitals vitals) { this.vitals = vitals; }

    public List<MedicalRecord.Prescription> getPrescriptions() { return prescriptions; }
    public void setPrescriptions(List<MedicalRecord.Prescription> prescriptions) { this.prescriptions = prescriptions; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public boolean isDispensed() { return dispensed; }
    public void setDispensed(boolean dispensed) { this.dispensed = dispensed; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
