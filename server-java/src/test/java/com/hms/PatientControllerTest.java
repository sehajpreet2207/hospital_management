package com.hms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.dto.LoginRequest;
import com.hms.dto.PatientRequest;
import com.hms.model.Appointment;
import com.hms.model.Patient;
import com.hms.repository.AppointmentRepository;
import com.hms.repository.PatientRepository;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class PatientControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    private String adminToken;
    private String receptionistToken;
    private String doctorToken;
    private String patientToken;
    private String createdPatientId;

    @BeforeAll
    public void setupTokens() throws Exception {
        // Admin token
        adminToken = login("admin@hms.com", "admin123");
        // Receptionist token
        receptionistToken = login("reception@hms.com", "reception123");
        // Doctor token
        doctorToken = login("ramesh@hms.com", "doctor123");
        // Patient token
        patientToken = login("riyash@hms.com", "patient123");
    }

    private String login(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        return root.get("token").asText();
    }

    @Test
    @Order(1)
    public void testGetPatientsAsAdmin() throws Exception {
        mockMvc.perform(get("/api/patients")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(2)
    public void testGetPatientsAsDoctor() throws Exception {
        mockMvc.perform(get("/api/patients")
                        .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(3)
    public void testGetPatientsAsPatientForbidden() throws Exception {
        mockMvc.perform(get("/api/patients")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have access to this action"));
    }

    @Test
    @Order(4)
    public void testSearchPatientsByQuery() throws Exception {
        mockMvc.perform(get("/api/patients?q=Riyash")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Mohammed Riyash"));
    }

    @Test
    @Order(5)
    public void testCreatePatientAsReceptionist() throws Exception {
        PatientRequest req = new PatientRequest();
        req.setName("Deepika Pad");
        req.setGender("Female");
        req.setPhone("9840112233");
        req.setEmail("deepika@example.com");
        req.setDob("1995-04-12");
        req.setBloodGroup("O+");
        req.setAddress("Velachery, Chennai");
        req.setAllergies("None");
        req.setEmergencyContact(new Patient.EmergencyContact("Mother", "9840112244"));

        MvcResult res = mockMvc.perform(post("/api/patients")
                        .header("Authorization", "Bearer " + receptionistToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$._id").isNotEmpty())
                .andExpect(jsonPath("$.patientId").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Deepika Pad"))
                .andExpect(jsonPath("$.bloodGroup").value("O+"))
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        createdPatientId = root.get("_id").asText();
        assertThat(createdPatientId).isNotBlank();
    }

    @Test
    @Order(6)
    public void testCreatePatientAsPatientForbidden() throws Exception {
        PatientRequest req = new PatientRequest();
        req.setName("Should Fail");
        req.setGender("Male");
        req.setPhone("9840999999");

        mockMvc.perform(post("/api/patients")
                        .header("Authorization", "Bearer " + patientToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have access to this action"));
    }

    @Test
    @Order(7)
    public void testGetPatientFileAsAdmin() throws Exception {
        mockMvc.perform(get("/api/patients/" + createdPatientId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient._id").value(createdPatientId))
                .andExpect(jsonPath("$.appointments").isArray())
                .andExpect(jsonPath("$.records").isArray())
                .andExpect(jsonPath("$.bills").isArray());
    }

    @Test
    @Order(8)
    public void testGetPatientFileAsPatientOwn() throws Exception {
        mockMvc.perform(get("/api/patients/me")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patient.email").value("riyash@hms.com"))
                .andExpect(jsonPath("$.appointments").isArray());
    }

    @Test
    @Order(9)
    public void testGetPatientFileAsPatientOtherForbidden() throws Exception {
        mockMvc.perform(get("/api/patients/" + createdPatientId)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You can only view your own file"));
    }

    @Test
    @Order(10)
    public void testUpdatePatientAsReceptionist() throws Exception {
        PatientRequest req = new PatientRequest();
        req.setName("Deepika Padukone");
        req.setAddress("Adyar, Chennai");

        mockMvc.perform(put("/api/patients/" + createdPatientId)
                        .header("Authorization", "Bearer " + receptionistToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Deepika Padukone"))
                .andExpect(jsonPath("$.address").value("Adyar, Chennai"));
    }

    @Test
    @Order(11)
    public void testDeletePatientBlockedByScheduledAppointment() throws Exception {
        // Create a scheduled appointment for this patient
        Appointment appt = new Appointment();
        appt.setPatient(createdPatientId);
        appt.setDoctor("dummy-doc");
        appt.setDate("2026-11-01");
        appt.setTime("10:00");
        appt.setStatus("Scheduled");
        appt = appointmentRepository.save(appt);

        // Attempt delete as admin -> should be blocked
        mockMvc.perform(delete("/api/patients/" + createdPatientId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Patient has upcoming appointments. Cancel them first."));

        // Clean up appointment
        appointmentRepository.delete(appt);
    }

    @Test
    @Order(12)
    public void testDeletePatientAsAdminSuccess() throws Exception {
        mockMvc.perform(delete("/api/patients/" + createdPatientId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Patient removed"));

        // Verify patient no longer exists
        mockMvc.perform(get("/api/patients/" + createdPatientId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Patient not found"));
    }
}
