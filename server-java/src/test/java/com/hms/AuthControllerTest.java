package com.hms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.dto.LoginRequest;
import com.hms.dto.PasswordChangeRequest;
import com.hms.dto.RegisterRequest;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Automated integration tests for Phase 1 Authentication and Health endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static String adminToken;
    private static String doctorToken;
    private static String newPatientToken;

    @Test
    @Order(1)
    public void testHealthEndpoint() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ok").value(true));
    }

    @Test
    @Order(2)
    public void testAdminLoginSuccess() throws Exception {
        LoginRequest req = new LoginRequest("admin@hms.com", "admin123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user._id").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Admin"))
                .andExpect(jsonPath("$.user.email").value("admin@hms.com"))
                .andExpect(jsonPath("$.user.role").value("admin"))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        adminToken = root.get("token").asText();
        assertThat(adminToken).isNotBlank();
    }

    @Test
    @Order(3)
    public void testDoctorLoginSuccess() throws Exception {
        LoginRequest req = new LoginRequest("ramesh@hms.com", "doctor123");

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.role").value("doctor"))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        doctorToken = root.get("token").asText();
    }

    @Test
    @Order(4)
    public void testLoginFailureWrongPassword() throws Exception {
        LoginRequest req = new LoginRequest("admin@hms.com", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @Order(5)
    public void testGetMeWithoutToken() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Please log in"));
    }

    @Test
    @Order(6)
    public void testGetMeWithAdminToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("admin@hms.com"))
                .andExpect(jsonPath("$.user.role").value("admin"))
                .andExpect(jsonPath("$.doctor").doesNotExist());
    }

    @Test
    @Order(7)
    public void testGetMeWithDoctorToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("ramesh@hms.com"))
                .andExpect(jsonPath("$.user.role").value("doctor"))
                .andExpect(jsonPath("$.doctor").exists())
                .andExpect(jsonPath("$.doctor.specialization").value("General Medicine"));
    }

    private static final String DYNAMIC_STUDENT_EMAIL = "student_" + System.currentTimeMillis() + "@example.com";

    @Test
    @Order(8)
    public void testPatientRegistrationSuccess() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test Student");
        req.setEmail(DYNAMIC_STUDENT_EMAIL);
        req.setPassword("student123");
        req.setPhone("9876543210");
        req.setGender("Male");
        req.setDob("2002-05-15");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.name").value("Test Student"))
                .andExpect(jsonPath("$.user.email").value(DYNAMIC_STUDENT_EMAIL))
                .andExpect(jsonPath("$.user.role").value("patient"))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        newPatientToken = root.get("token").asText();
    }

    @Test
    @Order(9)
    public void testPatientDuplicateRegistrationConflict() throws Exception {
        RegisterRequest req = new RegisterRequest();
        req.setName("Test Student Duplicate");
        req.setEmail(DYNAMIC_STUDENT_EMAIL); // Duplicate email
        req.setPassword("student123");
        req.setPhone("9876543210");
        req.setGender("Male");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    @Order(10)
    public void testGetMeWithNewPatientToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + newPatientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(DYNAMIC_STUDENT_EMAIL))
                .andExpect(jsonPath("$.user.role").value("patient"))
                .andExpect(jsonPath("$.patient").exists())
                .andExpect(jsonPath("$.patient.patientId").isNotEmpty())
                .andExpect(jsonPath("$.patient.gender").value("Male"));
    }

    @Test
    @Order(11)
    public void testPasswordUpdateWithWrongCurrentPassword() throws Exception {
        PasswordChangeRequest req = new PasswordChangeRequest("wrongpass", "newpass123");

        mockMvc.perform(put("/api/auth/password")
                        .header("Authorization", "Bearer " + newPatientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Current password is wrong"));
    }

    @Test
    @Order(12)
    public void testPasswordUpdateSuccess() throws Exception {
        PasswordChangeRequest req = new PasswordChangeRequest("student123", "newpassword123");

        mockMvc.perform(put("/api/auth/password")
                        .header("Authorization", "Bearer " + newPatientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password updated"));

        // Verify login works with new password
        LoginRequest loginReq = new LoginRequest(DYNAMIC_STUDENT_EMAIL, "newpassword123");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
    }
}
