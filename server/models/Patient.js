const mongoose = require('mongoose');
const { nextCode } = require('./Counter');

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    dob: Date,
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    address: String,
    bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
    emergencyContact: { name: String, phone: String },
    allergies: String,
  },
  { timestamps: true }
);

patientSchema.pre('save', async function (next) {
  if (!this.patientId) this.patientId = await nextCode('patient', 'P');
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
