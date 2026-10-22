const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    name: { type: String, required: true },
    dosage: String, // e.g. 1-0-1
    days: Number,
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    visitDate: { type: Date, default: Date.now },
    symptoms: String,
    diagnosis: { type: String, required: true },
    treatment: String,
    vitals: { bp: String, pulse: String, temperature: String, weight: String },
    prescriptions: [prescriptionSchema],
    notes: String,
    dispensed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
