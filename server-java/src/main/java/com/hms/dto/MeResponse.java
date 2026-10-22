package com.hms.dto;

import com.hms.model.Doctor;
import com.hms.model.Patient;

public class MeResponse {

    private PublicUser user;
    private Doctor doctor;
    private Patient patient;

    public MeResponse() {}

    public MeResponse(PublicUser user, Doctor doctor, Patient patient) {
        this.user = user;
        this.doctor = doctor;
        this.patient = patient;
    }

    public PublicUser getUser() { return user; }
    public void setUser(PublicUser user) { this.user = user; }

    public Doctor getDoctor() { return doctor; }
    public void setDoctor(Doctor doctor) { this.doctor = doctor; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }
}
