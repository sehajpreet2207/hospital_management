const router = require('express').Router();
const Medicine = require('../models/Medicine');
const { asyncHandler, protect, allow } = require('../middleware/auth');

router.use(protect, allow('admin', 'receptionist', 'doctor'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.q) filter.name = new RegExp(req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (req.query.low) filter.$expr = { $lte: ['$stock', '$reorderLevel'] };
    res.json(await Medicine.find(filter).sort({ name: 1 }));
  })
);

router.post(
  '/',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => res.status(201).json(await Medicine.create(req.body)))
);

router.put(
  '/:id',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const med = await Medicine.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.json(med);
  })
);

// Add received stock
router.patch(
  '/:id/restock',
  allow('admin', 'receptionist'),
  asyncHandler(async (req, res) => {
    const qty = Number(req.body.quantity);
    if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ message: 'Enter a valid quantity' });
    const med = await Medicine.findByIdAndUpdate(req.params.id, { $inc: { stock: qty } }, { new: true });
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.json(med);
  })
);

router.delete(
  '/:id',
  allow('admin'),
  asyncHandler(async (req, res) => {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ message: 'Medicine removed' });
  })
);

module.exports = router;
