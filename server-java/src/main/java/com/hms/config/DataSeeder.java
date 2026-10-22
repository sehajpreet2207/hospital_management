package com.hms.config;

import com.hms.model.Doctor;
import com.hms.model.Patient;
import com.hms.model.User;
import com.hms.repository.DoctorRepository;
import com.hms.repository.PatientRepository;
import com.hms.repository.UserRepository;
import com.hms.service.CounterService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Initializes essential demo users and profiles on first boot if the database is empty.
 *
 * Safe and non-destructive:
 * - Checks `userRepository.count() == 0` before doing anything.
 * - If any users already exist, it logs a message and exits immediately.
 * - Replaces the automatic seeding done by `server/index.js` / `server/seed.js`.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final CounterService counterService;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
            UserRepository userRepository,
            DoctorRepository doctorRepository,
            PatientRepository patientRepository,
            CounterService counterService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.counterService = counterService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already contains user records. Skipping initial seeding.");
            return;
        }

        log.info("Empty database detected. Seeding demo logins and baseline records...");

        // 1. Admin account
        User admin = new User();
        admin.setName("Admin");
        admin.setEmail("admin@hms.com");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setRole("admin");
        admin.setActive(true);
        userRepository.save(admin);

        // 2. Receptionist account
        User reception = new User();
        reception.setName("Anitha R");
        reception.setEmail("reception@hms.com");
        reception.setPassword(passwordEncoder.encode("reception123"));
        reception.setRole("receptionist");
        reception.setActive(true);
        userRepository.save(reception);

        // 3. Demo Doctors (matches seed.js)
        record DoctorSeed(String name, String spec, String qual, int exp, double fee,
                          List<String> days, String start, String end, String email, String phone) {}

        List<DoctorSeed> doctors = List.of(
                new DoctorSeed("Dr. Ramesh Kumar", "General Medicine", "MBBS, MD", 14, 300.0,
                        List.of("Mon", "Tue", "Wed", "Thu", "Fri", "Sat"), "09:00", "13:00", "ramesh@hms.com", "9840012345"),
                new DoctorSeed("Dr. Priya Lakshmi", "Cardiology", "MBBS, MD, DM (Cardio)", 11, 600.0,
                        List.of("Mon", "Wed", "Fri"), "10:00", "14:00", "priya@hms.com", "9840023456"),
                new DoctorSeed("Dr. Arun Prakash", "Orthopaedics", "MBBS, MS (Ortho)", 9, 500.0,
                        List.of("Tue", "Thu", "Sat"), "09:30", "13:30", "arun@hms.com", "9840034567"),
                new DoctorSeed("Dr. Fathima Begum", "Paediatrics", "MBBS, DCH", 12, 400.0,
                        List.of("Mon", "Tue", "Wed", "Thu", "Fri"), "16:00", "20:00", "fathima@hms.com", "9840045678"),
                new DoctorSeed("Dr. Senthil Nathan", "ENT", "MBBS, MS (ENT)", 7, 400.0,
                        List.of("Mon", "Wed", "Thu", "Sat"), "11:00", "15:00", "senthil@hms.com", "9840056789"),
                new DoctorSeed("Dr. Kavitha Rajan", "Gynaecology", "MBBS, MS (OG)", 15, 500.0,
                        List.of("Tue", "Wed", "Fri", "Sat"), "10:00", "13:00", "kavitha@hms.com", "9840067890"),
                new DoctorSeed("Dr. Joseph Antony", "Dermatology", "MBBS, MD (DVL)", 6, 450.0,
                        List.of("Mon", "Thu", "Fri"), "15:00", "19:00", "joseph@hms.com", "9840078901"),
                new DoctorSeed("Dr. Meena Subramanian", "Neurology", "MBBS, MD, DM (Neuro)", 18, 700.0,
                        List.of("Tue", "Thu"), "09:00", "12:00", "meena@hms.com", "9840089012")
        );

        for (DoctorSeed ds : doctors) {
            User docUser = new User();
            docUser.setName(ds.name());
            docUser.setEmail(ds.email());
            docUser.setPassword(passwordEncoder.encode("doctor123"));
            docUser.setRole("doctor");
            docUser.setActive(true);
            docUser = userRepository.save(docUser);

            Doctor doc = new Doctor();
            doc.setDoctorId(counterService.nextCode("doctor", "D", 3));
            doc.setUser(docUser.getId());
            doc.setName(ds.name());
            doc.setSpecialization(ds.spec());
            doc.setQualification(ds.qual());
            doc.setExperience(ds.exp());
            doc.setFee(ds.fee());
            doc.setDays(ds.days());
            doc.setStartTime(ds.start());
            doc.setEndTime(ds.end());
            doc.setEmail(ds.email());
            doc.setPhone(ds.phone());
            doc.setAvailable(true);
            doctorRepository.save(doc);
        }

        // 4. Demo Patients (matches seed.js demo logins)
        record PatientSeed(String name, String gender, String dob, String blood, String email, String phone) {}

        List<PatientSeed> patients = List.of(
                new PatientSeed("Mohammed Riyash", "Male", "2005-03-14", "O+", "riyash@hms.com", "9840091111"),
                new PatientSeed("Syed Kalith", "Male", "2005-07-22", "B+", "kalith@hms.com", "9840092222")
        );

        for (PatientSeed ps : patients) {
            User patUser = new User();
            patUser.setName(ps.name());
            patUser.setEmail(ps.email());
            patUser.setPassword(passwordEncoder.encode("patient123"));
            patUser.setRole("patient");
            patUser.setActive(true);
            patUser = userRepository.save(patUser);

            Patient pat = new Patient();
            pat.setPatientId(counterService.nextCode("patient", "P", 4));
            pat.setUser(patUser.getId());
            pat.setName(ps.name());
            pat.setGender(ps.gender());
            pat.setDob(ps.dob());
            pat.setBloodGroup(ps.blood());
            pat.setEmail(ps.email());
            pat.setPhone(ps.phone());
            pat.setAddress("Tambaram, Chennai");
            pat.setEmergencyContact(new Patient.EmergencyContact("Father", "9840090000"));
            patientRepository.save(pat);
        }

        log.info("Demo seeding complete: Admin, Receptionist, 8 Doctors, and 2 Patients created.");
    }
}
