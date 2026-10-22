const router = require('express').Router();
const User = require('../models/User');
const Patient = require('../models/Patient');
const { asyncHandler, signToken, protect } = require('../middleware/auth');

const publicUser = (u) => ({ _id: u._id, name: u.name, email: u.email, role: u.role });

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    if (!user.active) return res.status(403).json({ message: 'This account has been disabled' });

    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

// Patients can create their own account; it is linked to a new patient record
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone, gender, dob } = req.body;
    if (!name || !email || !password || !phone || !gender) {
      return res.status(400).json({ message: 'Name, email, password, phone and gender are required' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password, role: 'patient' });
    // Reuse a record the front desk already created with the same email, if any
    let patient = await Patient.findOne({ email: email.toLowerCase(), user: { $exists: false } });
    if (patient) {
      patient.user = user._id;
      await patient.save();
    } else {
      await Patient.create({ user: user._id, name, email, phone, gender, dob: dob || undefined });
    }

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    res.json({
      user: publicUser(req.user),
      doctor: req.doctor || null,
      patient: req.patient || null,
    });
  })
);

router.put(
  '/password',
  protect,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword || ''))) {
      return res.status(400).json({ message: 'Current password is wrong' });
    }
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

module.exports = router;
