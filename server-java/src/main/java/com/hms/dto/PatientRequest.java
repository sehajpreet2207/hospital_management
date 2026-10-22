package com.hms.dto;

import com.hms.model.Patient;

public class PatientRequest {

    private String name;
    private String dob;
    private String gender;
    private String phone;
    private String email;
    private String address;
    private String bloodGroup;
    private Patient.EmergencyContact emergencyContact;
    private String allergies;

    public PatientRequest() {}

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDob() { return dob; }
    public void setDob(String dob) { this.dob = dob; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public Patient.EmergencyContact getEmergencyContact() { return emergencyContact; }
    public void setEmergencyContact(Patient.EmergencyContact emergencyContact) { this.emergencyContact = emergencyContact; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
}
