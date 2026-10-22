const router = require('express').Router();
const MedicalRecord = require('../models/MedicalRecord');
const Appointment = require('../models/Appointment');
const Medicine = require('../models/Medicine');
const Bill = require('../models/Bill');
const Doctor = require('../models/Doctor');
const { asyncHandler, protect, allow } = require('../middleware/auth');

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role === 'patient') filter.patient = req.patient?._id;
    else if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.mine && req.user.role === 'doctor') filter.doctor = req.doctor?._id;
    if (req.query.pending) filter.dispensed = false;
    if (req.query.pending) filter['prescriptions.0'] = { $exists: true };

    const records = await MedicalRecord.find(filter)
      .populate('patient', 'name patientId gender dob')
      .populate('doctor', 'name specialization')
      .sort({ visitDate: -1 });
    res.json(records);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id)
      .populate('patient')
      .populate('doctor', 'name specialization qualification');
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (req.user.role === 'patient' && String(record.patient._id) !== String(req.patient?._id)) {
      return res.status(403).json({ message: 'You can only view your own records' });
    }
    res.json(record);
  })
);

// Doctor writes the consultation notes; the linked appointment is marked completed
router.post(
  '/',
  allow('doctor', 'admin'),
  asyncHandler(async (req, res) => {
    const doctorId = req.user.role === 'doctor' ? req.doctor?._id : req.body.doctor;
    if (!doctorId) return res.status(400).json({ message: 'No doctor profile linked to this account' });

    const record = await MedicalRecord.create({ ...req.body, doctor: doctorId, dispensed: false });
    if (record.appointment) {
      await Appointment.findByIdAndUpdate(record.appointment, { status: 'Completed' });
      // Raise the consultation fee bill once per visit
      const billed = await Bill.exists({ appointment: record.appointment, 'items.category': 'Consultation' });
      const doctor = await Doctor.findById(doctorId);
      if (!billed && doctor?.fee) {
        await Bill.create({
          patient: record.patient, appointment: record.appointment, createdBy: req.user._id,
          items: [{ description: `Consultation - ${doctor.name}`, category: 'Consultation', quantity: 1, rate: doctor.fee }],
        });
      }
    }
    res.status(201).json(record);
  })
);

router.put(
  '/:id',
  allow('doctor', 'admin'),
  asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (req.user.role === 'doctor' && String(record.doctor) !== String(req.doctor?._id)) {
      return res.status(403).json({ message: 'Only the treating doctor can edit this record' });
    }
    const { patient, doctor, dispensed, ...updates } = req.body;
    if (record.dispensed && updates.prescriptions) delete updates.prescriptions;
    Object.assign(record, updates);
    await record.save();
    res.json(record);
  })
);

// Pharmacy: issue the prescribed medicines, reduce stock and raise a pharmacy bill
router.post(
  '/:id/dispense',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found' });
    if (record.dispensed) return res.status(400).json({ message: 'Medicines already issued for this visit' });

    const items = [];
    const shortages = [];
    const stocked = [];
    for (const p of record.prescriptions) {
      const med = p.medicine ? await Medicine.findById(p.medicine) : await Medicine.findOne({ name: p.name });
      if (!med) { shortages.push(`${p.name} (not in pharmacy)`); continue; }
      if (med.stock < p.quantity) { shortages.push(`${med.name} (only ${med.stock} left)`); continue; }
      stocked.push({ med, qty: p.quantity });
      items.push({ description: med.name, category: 'Pharmacy', quantity: p.quantity, rate: med.unitPrice });
    }
    if (shortages.length) {
      return res.status(400).json({ message: `Cannot issue: ${shortages.join(', ')}` });
    }

    // Decrement only when stock is still enough, so two counters cannot oversell
    for (const s of stocked) {
      const r = await Medicine.updateOne({ _id: s.med._id, stock: { $gte: s.qty } }, { $inc: { stock: -s.qty } });
      if (!r.modifiedCount) return res.status(409).json({ message: `${s.med.name} stock changed, try again` });
    }

    let bill = null;
    if (items.length) {
      bill = await Bill.create({
        patient: record.patient, appointment: record.appointment, items, createdBy: req.user._id,
      });
    }
    record.dispensed = true;
    await record.save();
    res.json({ record, bill });
  })
);

module.exports = router;
