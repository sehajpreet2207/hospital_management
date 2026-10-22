const router = require('express').Router();
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { asyncHandler, protect, allow } = require('../middleware/auth');

router.use(protect, allow('admin'));

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ role: 1, name: 1 });
    res.json(users);
  })
);

// Create a login. For doctors, an existing doctor profile can be linked by doctorRef.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, password, role, doctorRef } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const user = await User.create({ name, email, password, role });

    if (role === 'doctor' && doctorRef) {
      await Doctor.findByIdAndUpdate(doctorRef, { user: user._id });
    }
    if (role === 'patient') {
      const patient = await Patient.findOne({ email: email.toLowerCase(), user: { $exists: false } });
      if (patient) {
        patient.user = user._id;
        await patient.save();
      }
    }
    res.status(201).json(user);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id) && req.body.active === false) {
      return res.status(400).json({ message: 'You cannot disable your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (typeof req.body.active === 'boolean') user.active = req.body.active;
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json(user);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    await Doctor.updateMany({ user: req.params.id }, { $unset: { user: 1 } });
    await Patient.updateMany({ user: req.params.id }, { $unset: { user: 1 } });
    res.json({ message: 'User deleted' });
  })
);

module.exports = router;
