const mongoose = require('mongoose');
const { nextCode } = require('./Counter');

const staffSchema = new mongoose.Schema(
  {
    staffId: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, required: true }, // Nurse, Lab Technician, Pharmacist...
    department: String,
    phone: String,
    email: { type: String, lowercase: true, trim: true },
    shift: { type: String, enum: ['Morning', 'Evening', 'Night'], default: 'Morning' },
    salary: Number,
    joinedOn: { type: Date, default: Date.now },
    status: { type: String, enum: ['On Duty', 'On Leave', 'Inactive'], default: 'On Duty' },
  },
  { timestamps: true }
);

staffSchema.pre('save', async function (next) {
  if (!this.staffId) this.staffId = await nextCode('staff', 'S', 3);
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
