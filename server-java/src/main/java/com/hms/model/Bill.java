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
 * Represents an invoice / billing document in the hospital.
 * Maps to the "bills" MongoDB collection.
 */
@Document(collection = "bills")
public class Bill {

    @Id
    @JsonProperty("_id")
    private String id;

    private String billNo;
    private String patient;
    private String appointment;
    private List<BillItem> items = new ArrayList<>();
    private Double discount = 0.0;
    private Double taxPercent = 0.0;
    private Double subtotal = 0.0;
    private Double total = 0.0;
    private String status = "Unpaid"; // "Unpaid", "Paid"
    private String paymentMethod = ""; // "Cash", "Card", "UPI", "Insurance", ""
    private Instant paidAt;
    private String createdBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // ---------------------------------------------------------------
    // Embedded sub-document: BillItem
    // ---------------------------------------------------------------

    public static class BillItem {
        private String description;
        private String category = "Other"; // "Consultation", "Pharmacy", "Lab", "Procedure", "Room", "Other"
        private Integer quantity = 1;
        private Double rate = 0.0;

        public BillItem() {}

        public BillItem(String description, String category, Integer quantity, Double rate) {
            this.description = description;
            this.category = category;
            this.quantity = quantity;
            this.rate = rate;
        }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }

        public Double getRate() { return rate; }
        public void setRate(Double rate) { this.rate = rate; }
    }

    public Bill() {}

    /**
     * Calculates subtotal and total based on items, discount, and tax percentage.
     * Mirrors the Mongoose pre-save hook in server/models/Bill.js:
     *   subtotal = sum(item.quantity * item.rate)
     *   afterDiscount = max(subtotal - discount, 0)
     *   total = round(afterDiscount * (1 + taxPercent / 100), 2)
     */
    public void calculateTotals() {
        double sum = 0.0;
        if (items != null) {
            for (BillItem item : items) {
                int qty = (item.getQuantity() != null && item.getQuantity() > 0) ? item.getQuantity() : 1;
                double rate = (item.getRate() != null && item.getRate() >= 0) ? item.getRate() : 0.0;
                sum += qty * rate;
            }
        }
        this.subtotal = sum;
        double disc = (discount != null && discount >= 0) ? discount : 0.0;
        double tax = (taxPercent != null && taxPercent >= 0) ? taxPercent : 0.0;
        double afterDiscount = Math.max(sum - disc, 0.0);
        this.total = Math.round(afterDiscount * (1.0 + tax / 100.0) * 100.0) / 100.0;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }

    public String getPatient() { return patient; }
    public void setPatient(String patient) { this.patient = patient; }

    public String getAppointment() { return appointment; }
    public void setAppointment(String appointment) { this.appointment = appointment; }

    public List<BillItem> getItems() { return items; }
    public void setItems(List<BillItem> items) { this.items = items; }

    public Double getDiscount() { return discount; }
    public void setDiscount(Double discount) { this.discount = discount; }

    public Double getTaxPercent() { return taxPercent; }
    public void setTaxPercent(Double taxPercent) { this.taxPercent = taxPercent; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public Instant getPaidAt() { return paidAt; }
    public void setPaidAt(Instant paidAt) { this.paidAt = paidAt; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
