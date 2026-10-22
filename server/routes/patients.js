const router = require('express').Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Bill = require('../models/Bill');
const { asyncHandler, protect, allow } = require('../middleware/auth');

router.use(protect);

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get(
  '/',
  allow('admin', 'receptionist', 'doctor'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.q) {
      const rx = new RegExp(escape(req.query.q), 'i');
      filter.$or = [{ name: rx }, { patientId: rx }, { phone: rx }, { email: rx }];
    }
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  })
);

// Full patient file: details + appointments + medical history + bills
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id === 'me' ? req.patient?._id : req.params.id;
    if (req.user.role === 'patient' && String(id) !== String(req.patient?._id)) {
      return res.status(403).json({ message: 'You can only view your own file' });
    }
    const patient = await Patient.findById(id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const [appointments, records, bills] = await Promise.all([
      Appointment.find({ patient: id }).populate('doctor', 'name specialization').sort({ date: -1, time: -1 }),
      MedicalRecord.find({ patient: id }).populate('doctor', 'name specialization').sort({ visitDate: -1 }),
      Bill.find({ patient: id }).sort({ createdAt: -1 }),
    ]);
    res.json({ patient, appointments, records, bills });
  })
);

router.post(
  '/',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id === 'me' ? req.patient?._id : req.params.id;
    const isOwn = req.user.role === 'patient' && String(id) === String(req.patient?._id);
    if (!isOwn && !['admin', 'receptionist'].includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this action' });
    }
    const { patientId, user, ...updates } = req.body;
    const patient = await Patient.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  })
);

router.delete(
  '/:id',
  allow('admin'),
  asyncHandler(async (req, res) => {
    const open = await Appointment.countDocuments({ patient: req.params.id, status: 'Scheduled' });
    if (open) return res.status(400).json({ message: 'Patient has upcoming appointments. Cancel them first.' });
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient removed' });
  })
);

module.exports = router;
