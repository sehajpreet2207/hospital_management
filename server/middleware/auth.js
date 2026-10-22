const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Verifies the Bearer token and loads the user plus their doctor/patient profile
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: 'Session expired, please log in again' });
  }

  const user = await User.findById(payload.id);
  if (!user || !user.active) return res.status(401).json({ message: 'Account not found or disabled' });
  req.user = user;

  if (user.role === 'doctor') req.doctor = await Doctor.findOne({ user: user._id });
  if (user.role === 'patient') req.patient = await Patient.findOne({ user: user._id });
  next();
});

const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have access to this action' });
  }
  next();
};

module.exports = { asyncHandler, signToken, protect, allow };
