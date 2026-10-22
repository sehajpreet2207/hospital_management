const router = require('express').Router();
const Bill = require('../models/Bill');
const { asyncHandler, protect, allow } = require('../middleware/auth');

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.user.role === 'patient') filter.patient = req.patient?._id;
    else if (req.user.role === 'doctor') return res.status(403).json({ message: 'Billing is handled by the front desk' });
    if (req.query.status) filter.status = req.query.status;
    if (req.query.patient && req.user.role !== 'patient') filter.patient = req.query.patient;

    const bills = await Bill.find(filter).populate('patient', 'name patientId phone').sort({ createdAt: -1 });
    res.json(bills);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const bill = await Bill.findById(req.params.id)
      .populate('patient')
      .populate({ path: 'appointment', populate: { path: 'doctor', select: 'name specialization' } })
      .populate('createdBy', 'name');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (req.user.role === 'patient' && String(bill.patient._id) !== String(req.patient?._id)) {
      return res.status(403).json({ message: 'You can only view your own bills' });
    }
    if (req.user.role === 'doctor') return res.status(403).json({ message: 'Billing is handled by the front desk' });
    res.json(bill);
  })
);

router.post(
  '/',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { patient, appointment, items, discount, taxPercent } = req.body;
    const bill = await Bill.create({
      patient, appointment: appointment || undefined, items, discount, taxPercent, createdBy: req.user._id,
    });
    res.status(201).json(bill);
  })
);

router.patch(
  '/:id/pay',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const { paymentMethod } = req.body;
    if (!['Cash', 'Card', 'UPI', 'Insurance'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Choose a payment method' });
    }
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ message: 'Bill is already paid' });
    bill.status = 'Paid';
    bill.paymentMethod = paymentMethod;
    bill.paidAt = new Date();
    await bill.save();
    res.json(bill);
  })
);

router.delete(
  '/:id',
  allow('admin'),
  asyncHandler(async (req, res) => {
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    if (bill.status === 'Paid') return res.status(400).json({ message: 'Paid bills cannot be deleted' });
    await bill.deleteOne();
    res.json({ message: 'Bill deleted' });
  })
);

module.exports = router;
