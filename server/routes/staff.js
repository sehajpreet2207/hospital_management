const router = require('express').Router();
const Staff = require('../models/Staff');
const { asyncHandler, protect, allow } = require('../middleware/auth');

router.use(protect, allow('admin'));

router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.department) filter.department = req.query.department;
  res.json(await Staff.find(filter).sort({ name: 1 }));
}));

router.post('/', asyncHandler(async (req, res) => res.status(201).json(await Staff.create(req.body))));

router.put('/:id', asyncHandler(async (req, res) => {
  const { staffId, ...updates } = req.body;
  const member = await Staff.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!member) return res.status(404).json({ message: 'Staff member not found' });
  res.json(member);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await Staff.findByIdAndDelete(req.params.id);
  res.json({ message: 'Staff member removed' });
}));

module.exports = router;
