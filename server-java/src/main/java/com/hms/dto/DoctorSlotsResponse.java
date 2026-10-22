package com.hms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DoctorSlotsResponse {

    private String day;
    private List<SlotItem> slots = new ArrayList<>();
    private String message;

    public DoctorSlotsResponse() {}

    public DoctorSlotsResponse(String day, List<SlotItem> slots) {
        this.day = day;
        this.slots = slots;
    }

    public DoctorSlotsResponse(String day, List<SlotItem> slots, String message) {
        this.day = day;
        this.slots = slots;
        this.message = message;
    }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public List<SlotItem> getSlots() { return slots; }
    public void setSlots(List<SlotItem> slots) { this.slots = slots; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
