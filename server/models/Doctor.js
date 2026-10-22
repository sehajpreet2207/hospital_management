const mongoose = require('mongoose');
const { nextCode } = require('./Counter');

const doctorSchema = new mongoose.Schema(
  {
    doctorId: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true },
    qualification: String,
    experience: { type: Number, default: 0 },
    phone: String,
    email: { type: String, lowercase: true, trim: true },
    fee: { type: Number, default: 300 },
    // Days the doctor sees patients and the daily OP timing
    days: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '13:00' },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.pre('save', async function (next) {
  if (!this.doctorId) this.doctorId = await nextCode('doctor', 'D', 3);
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
