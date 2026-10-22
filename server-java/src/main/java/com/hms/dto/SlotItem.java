package com.hms.dto;

public class SlotItem {

    private String time;
    private boolean free;

    public SlotItem() {}

    public SlotItem(String time, boolean free) {
        this.time = time;
        this.free = free;
    }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public boolean isFree() { return free; }
    public void setFree(boolean free) { this.free = free; }
}
