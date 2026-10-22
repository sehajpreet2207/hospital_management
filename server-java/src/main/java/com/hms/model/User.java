package com.hms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Represents a login account in the system.
 *
 * Maps to the "users" MongoDB collection (same collection used by the Node.js backend,
 * but in our separate Java database instance on port 27017).
 *
 * Roles:
 *   - "admin"        : full access to everything
 *   - "doctor"       : sees only their own patients and records
 *   - "receptionist" : handles registration, appointments, billing
 *   - "patient"      : sees only their own data
 *
 * === Key Java/Spring annotations used here ===
 *
 * @Document(collection = "users")
 *   Tells Spring Data MongoDB that instances of this class are stored in
 *   the "users" collection. Without this, Spring would use the class name
 *   as the collection name (which would be "user", not "users").
 *
 * @Id
 *   Marks this field as the document's primary key. Spring Data MongoDB
 *   maps this to the "_id" field in MongoDB. MongoDB auto-generates a
 *   unique ObjectId string if you don't set it yourself.
 *
 * @JsonProperty("_id")
 *   The React frontend expects the MongoDB "_id" field name in JSON responses.
 *   By default, Jackson (Java's JSON library) would serialize this as "id"
 *   (the Java field name). This annotation overrides that, making the JSON
 *   output use "_id" — exactly what the frontend expects.
 *
 * @JsonIgnore
 *   Prevents the password hash from ever being included in API responses.
 *   Jackson will completely skip this field when serializing to JSON.
 *   This is equivalent to Mongoose's { select: false } on the password field.
 *
 * @Indexed(unique = true)
 *   Creates a unique index in MongoDB on the email field, preventing duplicate
 *   email registrations. Same as Mongoose's { unique: true }.
 *
 * @CreatedDate / @LastModifiedDate
 *   Spring Data MongoDB auditing automatically fills these fields on save.
 *   Requires @EnableMongoAuditing on HmsApplication. Equivalent to
 *   Mongoose's { timestamps: true }.
 */
@Document(collection = "users")
public class User {

    @Id
    @JsonProperty("_id")
    private String id;

    private String name;

    @Indexed(unique = true)
    private String email;

    @JsonIgnore  // Never send the bcrypt hash to the client
    private String password;

    /** One of: "admin", "doctor", "receptionist", "patient" */
    private String role;

    /** When false, the user cannot log in even with a correct password. */
    private boolean active = true;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    // ---------------------------------------------------------------
    // Constructors
    // ---------------------------------------------------------------

    /** No-arg constructor required by Spring Data MongoDB for deserialization. */
    public User() {}

    public User(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // ---------------------------------------------------------------
    // Getters and Setters
    // ---------------------------------------------------------------

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    // NOTE: Even though @JsonIgnore is on the field, we need the getter
    // for Spring Data MongoDB to access the password when saving.
    // Jackson ignores it based on the field annotation; Spring Data uses
    // the getter internally.
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
