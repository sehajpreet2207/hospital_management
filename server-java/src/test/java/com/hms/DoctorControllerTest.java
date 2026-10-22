package com.hms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hms.dto.DoctorRequest;
import com.hms.dto.LoginRequest;
import com.hms.model.Appointment;
import com.hms.model.Doctor;
import com.hms.repository.AppointmentRepository;
import com.hms.repository.DoctorRepository;
import com.hms.repository.UserRepository;
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

import java.time.LocalDate;
import java.util.List;

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
public class DoctorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private DoctorRepository doctorRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String receptionistToken;
    private String doctorToken;
    private String patientToken;
    private Doctor rameshDoctor;
    private String createdDoctorId;

    @BeforeAll
    public void setupTokens() throws Exception {
        adminToken = login("admin@hms.com", "admin123");
        receptionistToken = login("reception@hms.com", "reception123");
        doctorToken = login("ramesh@hms.com", "doctor123");
        patientToken = login("riyash@hms.com", "patient123");

        rameshDoctor = doctorRepository.findAll().stream()
                .filter(d -> "Dr. Ramesh Kumar".equals(d.getName()))
                .findFirst()
                .orElseThrow();
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
    public void testGetDoctorsAsAdmin() throws Exception {
        mockMvc.perform(get("/api/doctors")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @Order(2)
    public void testGetDoctorsBySpecialization() throws Exception {
        mockMvc.perform(get("/api/doctors?specialization=Cardiology")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Dr. Priya Lakshmi"))
                .andExpect(jsonPath("$[0].specialization").value("Cardiology"));
    }

    @Test
    @Order(3)
    public void testGetDoctorById() throws Exception {
        mockMvc.perform(get("/api/doctors/" + rameshDoctor.getId())
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Dr. Ramesh Kumar"))
                .andExpect(jsonPath("$.fee").value(300.0));
    }

    @Test
    @Order(4)
    public void testGetSlotsInvalidDate() throws Exception {
        mockMvc.perform(get("/api/doctors/" + rameshDoctor.getId() + "/slots?date=not-a-date")
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Pick a valid date"));
    }

    @Test
    @Order(5)
    public void testGetSlotsOnNonOpDay() throws Exception {
        // Ramesh consults Mon-Sat, Sunday is not an OP day
        // Find next Sunday
        LocalDate date = LocalDate.now();
        while (date.getDayOfWeek().getValue() != 7) { // 7 is Sunday
            date = date.plusDays(1);
        }

        mockMvc.perform(get("/api/doctors/" + rameshDoctor.getId() + "/slots?date=" + date)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.day").value("Sun"))
                .andExpect(jsonPath("$.slots").isEmpty())
                .andExpect(jsonPath("$.message").value("Dr. Ramesh Kumar is not available on Sun"));
    }

    @Test
    @Order(6)
    public void testGetSlotsOnOpDay() throws Exception {
        // Find next Monday
        LocalDate date = LocalDate.now().plusDays(1);
        while (date.getDayOfWeek().getValue() != 1) { // 1 is Monday
            date = date.plusDays(1);
        }

        mockMvc.perform(get("/api/doctors/" + rameshDoctor.getId() + "/slots?date=" + date)
                        .header("Authorization", "Bearer " + patientToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.day").value("Mon"))
                .andExpect(jsonPath("$.slots").isArray())
                .andExpect(jsonPath("$.slots[0].time").value("09:00"))
                .andExpect(jsonPath("$.slots[0].free").value(true));
    }

    @Test
    @Order(7)
    public void testCreateDoctorForbiddenForReceptionist() throws Exception {
        DoctorRequest req = new DoctorRequest();
        req.setName("Dr. New");
        req.setSpecialization("General");

        mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + receptionistToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You do not have access to this action"));
    }

    @Test
    @Order(8)
    public void testCreateDoctorAsAdminWithLogin() throws Exception {
        String uniqueEmail = "dr.anand." + System.currentTimeMillis() + "@hms.com";
        DoctorRequest req = new DoctorRequest();
        req.setName("Dr. Anand Verma");
        req.setSpecialization("General Medicine");
        req.setQualification("MBBS, MD");
        req.setExperience(8);
        req.setEmail(uniqueEmail);
        req.setPhone("9840188888");
        req.setFee(350.0);
        req.setDays(List.of("Mon", "Wed", "Fri"));
        req.setStartTime("10:00");
        req.setEndTime("14:00");
        req.setLoginPassword("doctor123");

        MvcResult res = mockMvc.perform(post("/api/doctors")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.doctorId").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Dr. Anand Verma"))
                .andExpect(jsonPath("$.user").isNotEmpty())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        createdDoctorId = root.get("_id").asText();
        assertThat(createdDoctorId).isNotBlank();

        // Verify that the user account was actually created and can log in
        login(uniqueEmail, "doctor123");
    }

    @Test
    @Order(9)
    public void testDoctorSelfEditAllowedFields() throws Exception {
        DoctorRequest req = new DoctorRequest();
        req.setDays(List.of("Mon", "Tue", "Wed", "Thu", "Fri"));
        req.setStartTime("08:30");
        req.setEndTime("12:30");
        req.setPhone("9840099999");

        mockMvc.perform(put("/api/doctors/" + rameshDoctor.getId())
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.startTime").value("08:30"))
                .andExpect(jsonPath("$.endTime").value("12:30"))
                .andExpect(jsonPath("$.phone").value("9840099999"));
    }

    @Test
    @Order(10)
    public void testDoctorSelfEditRestrictedFieldIgnored() throws Exception {
        // A doctor trying to change their own fee should be ignored (fee remains 300)
        DoctorRequest req = new DoctorRequest();
        req.setFee(1000.0); // Not allowed for self-edit

        mockMvc.perform(put("/api/doctors/" + rameshDoctor.getId())
                        .header("Authorization", "Bearer " + doctorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fee").value(300.0)); // Fee preserved
    }

    @Test
    @Order(11)
    public void testDeleteDoctorBlockedByScheduledAppointment() throws Exception {
        Appointment appt = new Appointment();
        appt.setDoctor(createdDoctorId);
        appt.setPatient("dummy-patient");
        appt.setDate("2026-11-05");
        appt.setTime("10:20");
        appt.setStatus("Scheduled");
        appt = appointmentRepository.save(appt);

        mockMvc.perform(delete("/api/doctors/" + createdDoctorId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Doctor has upcoming appointments. Reassign or cancel them first."));

        // Clean up appointment
        appointmentRepository.delete(appt);
    }

    @Test
    @Order(12)
    public void testDeleteDoctorAsAdminSuccess() throws Exception {
        mockMvc.perform(delete("/api/doctors/" + createdDoctorId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Doctor removed"));

        mockMvc.perform(get("/api/doctors/" + createdDoctorId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Doctor not found"));
    }
}
