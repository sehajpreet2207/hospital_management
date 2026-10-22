const router = require('express').Router();
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { asyncHandler, protect, allow } = require('../middleware/auth');
const { localDate } = require('../utils');

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role === 'patient') filter.patient = req.patient?._id;
    if (req.user.role === 'doctor') filter.doctor = req.doctor?._id;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.doctor && req.user.role !== 'doctor') filter.doctor = req.query.doctor;
    if (req.query.patient && req.user.role !== 'patient') filter.patient = req.query.patient;
    if (req.query.upcoming) filter.date = { $gte: localDate() };

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name patientId phone gender dob')
      .populate('doctor', 'name specialization fee')
      .sort({ date: req.query.upcoming ? 1 : -1, time: 1 });
    res.json(appointments);
  })
);

router.post(
  '/',
  allow('admin', 'receptionist', 'patient'),
  asyncHandler(async (req, res) => {
    const { doctor: doctorId, date, time, reason } = req.body;
    const patientId = req.user.role === 'patient' ? req.patient?._id : req.body.patient;
    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ message: 'Patient, doctor, date and time are required' });
    }
    if (date < localDate()) return res.status(400).json({ message: 'Cannot book an appointment in the past' });

    const [doctor, patient] = await Promise.all([Doctor.findById(doctorId), Patient.findById(patientId)]);
    if (!doctor || !patient) return res.status(404).json({ message: 'Doctor or patient not found' });

    const day = DAY_NAMES[new Date(`${date}T00:00:00`).getDay()];
    if (!doctor.available || !doctor.days.includes(day)) {
      return res.status(400).json({ message: `${doctor.name} does not consult on ${day}` });
    }
    if (time < doctor.startTime || time >= doctor.endTime) {
      return res.status(400).json({ message: `OP timing is ${doctor.startTime} to ${doctor.endTime}` });
    }

    try {
      const appt = await Appointment.create({
        patient: patientId, doctor: doctorId, date, time, reason, bookedBy: req.user._id,
      });
      res.status(201).json(await appt.populate([
        { path: 'patient', select: 'name patientId phone' },
        { path: 'doctor', select: 'name specialization fee' },
      ]));
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'This slot was just booked. Pick another time.' });
      throw err;
    }
  })
);

// Status change: Completed (doctor/staff) or Cancelled (anyone involved)
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['Scheduled', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    const role = req.user.role;
    if (role === 'patient') {
      if (String(appt.patient) !== String(req.patient?._id) || status !== 'Cancelled') {
        return res.status(403).json({ message: 'You can only cancel your own appointments' });
      }
    }
    if (role === 'doctor' && String(appt.doctor) !== String(req.doctor?._id)) {
      return res.status(403).json({ message: 'This appointment belongs to another doctor' });
    }

    appt.status = status;
    try {
      await appt.save();
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ message: 'That slot has been taken by another booking' });
      throw err;
    }
    res.json(appt);
  })
);

router.delete(
  '/:id',
  allow('admin'),
  asyncHandler(async (req, res) => {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted' });
  })
);

module.exports = router;
