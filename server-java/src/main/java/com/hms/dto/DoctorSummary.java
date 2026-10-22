package com.hms.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.hms.model.Doctor;

public class DoctorSummary {

    @JsonProperty("_id")
    private String id;
    private String name;
    private String specialization;
    private Double fee;

    public DoctorSummary() {}

    public DoctorSummary(String id, String name, String specialization, Double fee) {
        this.id = id;
        this.name = name;
        this.specialization = specialization;
        this.fee = fee;
    }

    public static DoctorSummary from(Doctor d) {
        if (d == null) return null;
        return new DoctorSummary(d.getId(), d.getName(), d.getSpecialization(), d.getFee());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
}
