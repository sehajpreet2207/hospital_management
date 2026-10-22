// Sample data for demo and testing. Run `npm run seed` to reset the database.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const MedicalRecord = require('./models/MedicalRecord');
const Bill = require('./models/Bill');
const Medicine = require('./models/Medicine');
const Staff = require('./models/Staff');
const { Counter } = require('./models/Counter');
const { localDate } = require('./utils');

// small deterministic random so every reseed gives the same data
let s = 42;
const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rand() * a.length)];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const doctorsData = [
  { name: 'Dr. Ramesh Kumar', specialization: 'General Medicine', qualification: 'MBBS, MD', experience: 14, fee: 300, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], startTime: '09:00', endTime: '13:00', email: 'ramesh@hms.com', phone: '9840012345' },
  { name: 'Dr. Priya Lakshmi', specialization: 'Cardiology', qualification: 'MBBS, MD, DM (Cardio)', experience: 11, fee: 600, days: ['Mon', 'Wed', 'Fri'], startTime: '10:00', endTime: '14:00', email: 'priya@hms.com', phone: '9840023456' },
  { name: 'Dr. Arun Prakash', specialization: 'Orthopaedics', qualification: 'MBBS, MS (Ortho)', experience: 9, fee: 500, days: ['Tue', 'Thu', 'Sat'], startTime: '09:30', endTime: '13:30', email: 'arun@hms.com', phone: '9840034567' },
  { name: 'Dr. Fathima Begum', specialization: 'Paediatrics', qualification: 'MBBS, DCH', experience: 12, fee: 400, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], startTime: '16:00', endTime: '20:00', email: 'fathima@hms.com', phone: '9840045678' },
  { name: 'Dr. Senthil Nathan', specialization: 'ENT', qualification: 'MBBS, MS (ENT)', experience: 7, fee: 400, days: ['Mon', 'Wed', 'Thu', 'Sat'], startTime: '11:00', endTime: '15:00', email: 'senthil@hms.com', phone: '9840056789' },
  { name: 'Dr. Kavitha Rajan', specialization: 'Gynaecology', qualification: 'MBBS, MS (OG)', experience: 15, fee: 500, days: ['Tue', 'Wed', 'Fri', 'Sat'], startTime: '10:00', endTime: '13:00', email: 'kavitha@hms.com', phone: '9840067890' },
  { name: 'Dr. Joseph Antony', specialization: 'Dermatology', qualification: 'MBBS, MD (DVL)', experience: 6, fee: 450, days: ['Mon', 'Thu', 'Fri'], startTime: '15:00', endTime: '19:00', email: 'joseph@hms.com', phone: '9840078901' },
  { name: 'Dr. Meena Subramanian', specialization: 'Neurology', qualification: 'MBBS, MD, DM (Neuro)', experience: 18, fee: 700, days: ['Tue', 'Thu'], startTime: '09:00', endTime: '12:00', email: 'meena@hms.com', phone: '9840089012' },
];

const patientsData = [
  ['Mohammed Riyash', 'Male', '2005-03-14', 'O+', 'riyash@hms.com'],
  ['Syed Kalith', 'Male', '2005-07-22', 'B+', 'kalith@hms.com'],
  ['Lakshmi Narayanan', 'Female', '1962-11-02', 'A+'],
  ['Karthik Raja', 'Male', '1990-01-19', 'B+'],
  ['Divya Bharathi', 'Female', '1996-05-30', 'O-'],
  ['Abdul Rahman', 'Male', '1978-09-08', 'AB+'],
  ['Sangeetha Mohan', 'Female', '1985-12-25', 'A-'],
  ['Vignesh Babu', 'Male', '2001-04-11', 'O+'],
  ['Revathi Shankar', 'Female', '1970-02-17', 'B-'],
  ['Aarav Krishnan', 'Male', '2019-08-03', 'A+'],
  ['Nandhini Selvam', 'Female', '1999-10-21', 'O+'],
  ['Prakash Velu', 'Male', '1958-06-29', 'B+'],
  ['Shalini Devi', 'Female', '1993-03-05', 'AB-'],
  ['Imran Khan', 'Male', '1987-07-14', 'O+'],
  ['Gayathri Ravi', 'Female', '2016-01-27', 'A+'],
  ['Murugan Pandi', 'Male', '1966-12-09', 'O+'],
  ['Jennifer Mary', 'Female', '1982-08-16', 'B+'],
  ['Hari Haran', 'Male', '1995-11-30', 'A-'],
];

const areas = ['Tambaram', 'Velachery', 'Adyar', 'Anna Nagar', 'T. Nagar', 'Sholinganallur', 'Pallikaranai', 'Medavakkam', 'Chromepet', 'Porur'];

const medicinesData = [
  ['Paracetamol 650mg', 'Tablet', 'Micro Labs', 500, 2.1],
  ['Amoxicillin 500mg', 'Capsule', 'Cipla', 240, 6.5],
  ['Azithromycin 500mg', 'Tablet', 'Alembic', 90, 22],
  ['Cetirizine 10mg', 'Tablet', 'Dr. Reddys', 300, 1.8],
  ['Pantoprazole 40mg', 'Tablet', 'Sun Pharma', 260, 5.4],
  ['Metformin 500mg', 'Tablet', 'USV', 400, 2.4],
  ['Amlodipine 5mg', 'Tablet', 'Cipla', 350, 2.9],
  ['Atorvastatin 10mg', 'Tablet', 'Lupin', 180, 7.2],
  ['Ibuprofen 400mg', 'Tablet', 'Abbott', 15, 3.1],
  ['Diclofenac Gel 30g', 'Ointment', 'Novartis', 12, 95],
  ['Cough Syrup 100ml', 'Syrup', 'Dabur', 40, 110],
  ['ORS Sachet', 'Powder', 'FDC', 150, 21],
  ['Vitamin D3 60K', 'Capsule', 'Mankind', 8, 35],
  ['Salbutamol Inhaler', 'Inhaler', 'Cipla', 25, 145],
  ['Calcium + D3', 'Tablet', 'Torrent', 220, 6],
  ['Ondansetron 4mg', 'Tablet', 'Sun Pharma', 120, 4.5],
];

const visitTemplates = {
  'General Medicine': [
    { symptoms: 'Fever for 3 days, body pain, headache', diagnosis: 'Viral fever', treatment: 'Rest, oral fluids, antipyretics', rx: [['Paracetamol 650mg', '1-1-1', 3, 9], ['ORS Sachet', 'as needed', 3, 4]] },
    { symptoms: 'Burning sensation in stomach after meals', diagnosis: 'Acid peptic disease', treatment: 'Avoid spicy food, small frequent meals', rx: [['Pantoprazole 40mg', '1-0-0 before food', 14, 14]] },
    { symptoms: 'Increased thirst, frequent urination', diagnosis: 'Type 2 diabetes mellitus', treatment: 'Diet control, daily walk, review with FBS/PPBS in 1 month', rx: [['Metformin 500mg', '1-0-1', 30, 60]] },
  ],
  Cardiology: [
    { symptoms: 'Headache, occasional giddiness, BP 160/100', diagnosis: 'Essential hypertension', treatment: 'Low salt diet, BP monitoring at home', rx: [['Amlodipine 5mg', '1-0-0', 30, 30]] },
    { symptoms: 'Routine check, high cholesterol in lipid profile', diagnosis: 'Dyslipidemia', treatment: 'Diet and exercise, repeat lipid profile after 3 months', rx: [['Atorvastatin 10mg', '0-0-1', 30, 30]] },
  ],
  Orthopaedics: [
    { symptoms: 'Lower back pain for 2 weeks, worse on bending', diagnosis: 'Mechanical low back pain', treatment: 'Back exercises, avoid lifting heavy weights', rx: [['Ibuprofen 400mg', '1-0-1 after food', 5, 10], ['Diclofenac Gel 30g', 'apply twice daily', 10, 1]] },
    { symptoms: 'Knee pain while climbing stairs', diagnosis: 'Early osteoarthritis of knee', treatment: 'Quadriceps strengthening, weight reduction', rx: [['Calcium + D3', '0-1-0', 30, 30], ['Vitamin D3 60K', 'once a week', 56, 8]] },
  ],
  Paediatrics: [
    { symptoms: 'Cough and cold for 4 days, mild fever', diagnosis: 'Upper respiratory tract infection', treatment: 'Steam inhalation, warm fluids', rx: [['Cough Syrup 100ml', '5ml thrice daily', 5, 1], ['Paracetamol 650mg', 'half tablet SOS', 3, 3]] },
    { symptoms: 'Loose stools 5 times since morning', diagnosis: 'Acute gastroenteritis', treatment: 'ORS after every loose stool, light diet', rx: [['ORS Sachet', 'after each stool', 3, 6], ['Ondansetron 4mg', 'SOS for vomiting', 2, 2]] },
  ],
  ENT: [
    { symptoms: 'Throat pain, difficulty swallowing', diagnosis: 'Acute tonsillitis', treatment: 'Warm saline gargle', rx: [['Amoxicillin 500mg', '1-1-1', 5, 15], ['Paracetamol 650mg', '1-0-1', 3, 6]] },
    { symptoms: 'Sneezing and running nose every morning', diagnosis: 'Allergic rhinitis', treatment: 'Avoid dust exposure', rx: [['Cetirizine 10mg', '0-0-1', 10, 10]] },
  ],
  Gynaecology: [
    { symptoms: 'Irregular periods for 4 months', diagnosis: 'Polycystic ovarian syndrome', treatment: 'USG pelvis, lifestyle changes, review with reports', rx: [['Metformin 500mg', '0-0-1', 30, 30]] },
  ],
  Dermatology: [
    { symptoms: 'Itchy red patches on arms', diagnosis: 'Allergic contact dermatitis', treatment: 'Avoid the trigger, moisturiser', rx: [['Cetirizine 10mg', '0-0-1', 7, 7]] },
  ],
  Neurology: [
    { symptoms: 'Recurrent one-sided headache with nausea', diagnosis: 'Migraine without aura', treatment: 'Headache diary, regular sleep', rx: [['Paracetamol 650mg', 'SOS', 10, 10], ['Ondansetron 4mg', 'SOS', 5, 5]] },
  ],
};

const reasons = ['Fever', 'Follow-up visit', 'Routine check-up', 'Pain', 'Review with reports', 'Cough and cold', 'BP check', 'Consultation'];

async function seed() {
  s = 42;
  await Promise.all([
    User.deleteMany({}), Patient.deleteMany({}), Doctor.deleteMany({}), Appointment.deleteMany({}),
    MedicalRecord.deleteMany({}), Bill.deleteMany({}), Medicine.deleteMany({}), Staff.deleteMany({}), Counter.deleteMany({}),
  ]);
  await Appointment.syncIndexes();

  const admin = await User.create({ name: 'Admin', email: 'admin@hms.com', password: 'admin123', role: 'admin' });
  const reception = await User.create({ name: 'Anitha R', email: 'reception@hms.com', password: 'reception123', role: 'receptionist' });

  const doctors = [];
  for (const d of doctorsData) {
    const user = await User.create({ name: d.name, email: d.email, password: 'doctor123', role: 'doctor' });
    doctors.push(await new Doctor({ ...d, user: user._id }).save());
  }

  const patients = [];
  for (const [name, gender, dob, bloodGroup, email] of patientsData) {
    const phone = '9' + String(Math.floor(rand() * 1e9)).padStart(9, '0');
    let user;
    if (email) user = await User.create({ name, email, password: 'patient123', role: 'patient' });
    patients.push(await new Patient({
      name, gender, dob, bloodGroup, phone,
      email: email || `${name.split(' ')[0].toLowerCase()}${Math.floor(rand() * 90 + 10)}@gmail.com`,
      address: `${Math.floor(rand() * 120) + 1}, ${pick(['Main Road', 'Cross Street', 'Nagar 2nd Street', 'Gandhi Street'])}, ${pick(areas)}, Chennai`,
      emergencyContact: { name: pick(['Father', 'Mother', 'Spouse', 'Brother', 'Sister']), phone: '9' + String(Math.floor(rand() * 1e9)).padStart(9, '0') },
      allergies: rand() < 0.15 ? pick(['Penicillin', 'Sulfa drugs', 'Dust']) : '',
      user: user?._id,
      createdAt: new Date(Date.now() - (40 + Math.floor(rand() * 300)) * 86400000),
    }).save());
  }

  const medicines = {};
  for (const [name, category, manufacturer, stock, unitPrice] of medicinesData) {
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 4 + Math.floor(rand() * 20));
    medicines[name] = await Medicine.create({ name, category, manufacturer, stock, unitPrice, expiryDate: exp, reorderLevel: 20 });
  }

  const staffData = [
    ['Selvi R', 'Staff Nurse', 'General Ward', 'Morning'], ['Deepa K', 'Staff Nurse', 'ICU', 'Night'],
    ['Manoj Kumar', 'Lab Technician', 'Laboratory', 'Morning'], ['Bhuvana S', 'Pharmacist', 'Pharmacy', 'Morning'],
    ['Ravi Chandran', 'Radiographer', 'Radiology', 'Evening'], ['Suganya P', 'Staff Nurse', 'Paediatric Ward', 'Evening'],
    ['Ganesh M', 'Ward Assistant', 'General Ward', 'Night'], ['Kalaivani T', 'Receptionist', 'Front Office', 'Morning'],
    ['Peter Raj', 'Ambulance Driver', 'Emergency', 'Night'], ['Uma Maheswari', 'Head Nurse', 'Nursing', 'Morning'],
  ];
  for (const [name, designation, department, shift] of staffData) {
    const joined = new Date();
    joined.setMonth(joined.getMonth() - Math.floor(rand() * 60) - 2);
    await new Staff({
      name, designation, department, shift, joinedOn: joined,
      phone: '9' + String(Math.floor(rand() * 1e9)).padStart(9, '0'),
      salary: designation.includes('Nurse') ? 28000 : designation === 'Ward Assistant' ? 15000 : 22000,
      status: rand() < 0.1 ? 'On Leave' : 'On Duty',
    }).save();
  }

  // Appointments from 25 days ago to 10 days ahead, inside each doctor's OP timing
  const today = localDate();
  const taken = new Set();
  const slotFor = (doc) => {
    const [h, m] = doc.startTime.split(':').map(Number);
    const [eh, em] = doc.endTime.split(':').map(Number);
    const count = Math.floor(((eh * 60 + em) - (h * 60 + m)) / 20);
    const mins = h * 60 + m + 20 * Math.floor(rand() * count);
    return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  };

  for (let offset = -25; offset <= 10; offset++) {
    const seenToday = new Set();
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const date = localDate(d);
    const day = DAY_NAMES[d.getDay()];
    const docsToday = doctors.filter((doc) => doc.days.includes(day));
    const n = offset === 0 ? 9 : offset < 0 ? 3 + Math.floor(rand() * 4) : Math.floor(rand() * 3);

    for (let i = 0; i < n && docsToday.length; i++) {
      const doc = docsToday[i % docsToday.length];
      const time = slotFor(doc);
      const key = `${doc._id}${date}${time}`;
      if (taken.has(key)) continue;
      taken.add(key);

      let patient = pick(patients);
      if (doc.specialization === 'Paediatrics') patient = pick(patients.filter((p) => new Date(p.dob).getFullYear() > 2012));
      if (doc.specialization === 'Gynaecology') patient = pick(patients.filter((p) => p.gender === 'Female' && new Date(p.dob).getFullYear() < 2008));

      if (seenToday.has(String(patient._id))) continue;
      seenToday.add(String(patient._id));

      let status = 'Scheduled';
      if (offset < 0) status = rand() < 0.12 ? 'Cancelled' : 'Completed';
      if (offset === 0 && i < 3) status = 'Completed';

      const appt = await Appointment.create({
        patient: patient._id, doctor: doc._id, date, time, status,
        reason: pick(reasons), bookedBy: reception._id,
        createdAt: new Date(d.getTime() - 2 * 86400000),
      });

      if (status !== 'Completed') continue;

      const tpl = pick(visitTemplates[doc.specialization]);
      const visitDate = new Date(`${date}T${time}:00`);
      const dispensed = offset < 0 || rand() < 0.5;
      await MedicalRecord.create({
        patient: patient._id, doctor: doc._id, appointment: appt._id, visitDate,
        symptoms: tpl.symptoms, diagnosis: tpl.diagnosis, treatment: tpl.treatment,
        vitals: {
          bp: `${110 + Math.floor(rand() * 40)}/${70 + Math.floor(rand() * 20)}`,
          pulse: String(68 + Math.floor(rand() * 24)),
          temperature: (97.6 + rand() * 3).toFixed(1),
          weight: String(new Date(patient.dob).getFullYear() > 2012 ? 18 + Math.floor(rand() * 15) : 50 + Math.floor(rand() * 35)),
        },
        prescriptions: tpl.rx.map(([name, dosage, days, quantity]) => ({ medicine: medicines[name]._id, name, dosage, days, quantity })),
        notes: rand() < 0.4 ? 'Review after one week if symptoms persist.' : '',
        dispensed,
      });

      // Consultation bill, plus pharmacy bill when medicines were issued
      const paid = offset < 0 ? rand() < 0.9 : rand() < 0.5;
      const paidAt = new Date(visitDate.getTime() + 30 * 60000);
      const consult = new Bill({
        patient: patient._id, appointment: appt._id, createdBy: reception._id,
        items: [{ description: `Consultation - ${doc.name}`, category: 'Consultation', quantity: 1, rate: doc.fee }],
        status: paid ? 'Paid' : 'Unpaid', paymentMethod: paid ? pick(['Cash', 'UPI', 'UPI', 'Card']) : '',
        paidAt: paid ? paidAt : undefined, createdAt: visitDate,
      });
      if (rand() < 0.25) consult.items.push({ description: pick(['Complete Blood Count', 'Blood Sugar (FBS/PPBS)', 'Lipid Profile', 'X-Ray', 'ECG']), category: 'Lab', quantity: 1, rate: pick([250, 180, 450, 400, 300]) });
      await consult.save();

      if (dispensed) {
        await new Bill({
          patient: patient._id, appointment: appt._id, createdBy: reception._id,
          items: tpl.rx.map(([name, , , quantity]) => ({ description: name, category: 'Pharmacy', quantity, rate: medicines[name].unitPrice })),
          status: paid ? 'Paid' : 'Unpaid', paymentMethod: paid ? pick(['Cash', 'UPI']) : '',
          paidAt: paid ? paidAt : undefined, createdAt: visitDate,
        }).save();
      }
    }
  }

  console.log(`Seeded: ${doctors.length} doctors, ${patients.length} patients, ${await Appointment.countDocuments()} appointments, ${await Bill.countDocuments()} bills`);
  return { admin };
}

module.exports = { seed };

if (require.main === module) {
  const { connectDB, disconnectDB } = require('./db');
  connectDB()
    .then(seed)
    .then(disconnectDB)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
