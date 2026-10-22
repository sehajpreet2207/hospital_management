package com.hms.dto;

import com.hms.model.Bill;
import com.hms.model.Patient;

import java.util.List;

public class PatientFileResponse {

    private Patient patient;
    private List<PopulatedAppointment> appointments;
    private List<PopulatedMedicalRecord> records;
    private List<Bill> bills;

    public PatientFileResponse() {}

    public PatientFileResponse(Patient patient, List<PopulatedAppointment> appointments,
                               List<PopulatedMedicalRecord> records, List<Bill> bills) {
        this.patient = patient;
        this.appointments = appointments;
        this.records = records;
        this.bills = bills;
    }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public List<PopulatedAppointment> getAppointments() { return appointments; }
    public void setAppointments(List<PopulatedAppointment> appointments) { this.appointments = appointments; }

    public List<PopulatedMedicalRecord> getRecords() { return records; }
    public void setRecords(List<PopulatedMedicalRecord> records) { this.records = records; }

    public List<Bill> getBills() { return bills; }
    public void setBills(List<Bill> bills) { this.bills = bills; }
}
