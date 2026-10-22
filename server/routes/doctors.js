const router = require('express').Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { asyncHandler, protect, allow } = require('../middleware/auth');
const { localDate } = require('../utils');

const SLOT_MINUTES = 20;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.specialization) filter.specialization = req.query.specialization;
    if (req.user.role === 'patient') filter.available = true;
    const doctors = await Doctor.find(filter).sort({ name: 1 });
    res.json(doctors);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  })
);

// Free OP slots for a doctor on a given date (YYYY-MM-DD)
router.get(
  '/:id/slots',
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ message: 'Pick a valid date' });

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const day = DAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
    if (!doctor.available || !doctor.days.includes(day)) {
      return res.json({ day, slots: [], message: `${doctor.name} is not available on ${day}` });
    }

    const booked = await Appointment.find({ doctor: doctor._id, date, status: 'Scheduled' }).distinct('time');
    const now = new Date();
    const today = localDate(now);
    const nowMin = now.getHours() * 60 + now.getMinutes();

    const slots = [];
    for (let m = toMin(doctor.startTime); m + SLOT_MINUTES <= toMin(doctor.endTime); m += SLOT_MINUTES) {
      const t = toTime(m);
      const past = date < today || (date === today && m <= nowMin);
      slots.push({ time: t, free: !booked.includes(t) && !past });
    }
    res.json({ day, slots });
  })
);

router.post(
  '/',
  allow('admin'),
  asyncHandler(async (req, res) => {
    const { loginPassword, ...data } = req.body;
    const doctor = new Doctor(data);

    // Optionally create the doctor's login in the same step
    if (loginPassword) {
      if (!data.email) return res.status(400).json({ message: 'Email is needed to create a login' });
      if (await User.findOne({ email: data.email.toLowerCase() })) {
        return res.status(409).json({ message: 'A login with this email already exists' });
      }
      const user = await User.create({ name: data.name, email: data.email, password: loginPassword, role: 'doctor' });
      doctor.user = user._id;
    }
    await doctor.save();
    res.status(201).json(doctor);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const isSelf = req.user.role === 'doctor' && String(req.doctor?._id) === req.params.id;
    if (req.user.role !== 'admin' && !isSelf) {
      return res.status(403).json({ message: 'You do not have access to this action' });
    }
    const { doctorId, user, loginPassword, ...updates } = req.body;
    // A doctor may only change their own timings and availability
    const allowed = isSelf && req.user.role !== 'admin'
      ? Object.fromEntries(Object.entries(updates).filter(([k]) => ['days', 'startTime', 'endTime', 'available', 'phone'].includes(k)))
      : updates;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, allowed, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  })
);

router.delete(
  '/:id',
  allow('admin'),
  asyncHandler(async (req, res) => {
    const open = await Appointment.countDocuments({ doctor: req.params.id, status: 'Scheduled' });
    if (open) return res.status(400).json({ message: 'Doctor has upcoming appointments. Reassign or cancel them first.' });
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (doctor?.user) await User.findByIdAndUpdate(doctor.user, { active: false });
    res.json({ message: 'Doctor removed' });
  })
);

module.exports = router;
