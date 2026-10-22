package com.hms.dto;

import java.util.List;

public class DoctorRequest {

    private String name;
    private String specialization;
    private String qualification;
    private Integer experience;
    private String phone;
    private String email;
    private Double fee;
    private List<String> days;
    private String startTime;
    private String endTime;
    private Boolean available;
    private String loginPassword;

    public DoctorRequest() {}

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

    public Boolean getAvailable() { return available; }
    public void setAvailable(Boolean available) { this.available = available; }

    public String getLoginPassword() { return loginPassword; }
    public void setLoginPassword(String loginPassword) { this.loginPassword = loginPassword; }
}
