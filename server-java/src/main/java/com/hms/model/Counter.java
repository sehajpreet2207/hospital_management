package com.hms.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Stores sequential counters for generating human-readable IDs.
 * Maps to the "counters" MongoDB collection.
 *
 * How it works:
 *   - Each counter has a name (e.g., "patient", "doctor", "bill")
 *   - Every time a new patient/doctor/bill is created, we atomically
 *     increment seq by 1 and return the new value
 *   - The service then formats it: prefix + zero-padded seq
 *     e.g., seq=5 with prefix="P" and width=4 → "P0005"
 *
 * Why atomic? In a concurrent system, two requests might try to get the
 * next patient ID at the same time. If we just read-then-write, both could
 * get the same number. MongoDB's findAndModify with $inc is a single atomic
 * operation that prevents this race condition.
 *
 * Equivalent to the Node.js Counter model and nextCode() function in counter.js.
 */
@Document(collection = "counters")
public class Counter {

    /**
     * The counter name, used as the MongoDB document _id.
     * Examples: "patient", "doctor", "bill", "staff"
     *
     * Note: @JsonProperty("_id") is intentionally NOT added here because
     * Counter documents are never sent to the frontend — they're internal only.
     */
    @Id
    @JsonProperty("_id")
    private String id;

    /** The current sequence value. Starts at 0 and increments on each use. */
    private int seq;

    public Counter() {}

    public Counter(String id, int seq) {
        this.id = id;
        this.seq = seq;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getSeq() { return seq; }
    public void setSeq(int seq) { this.seq = seq; }
}
