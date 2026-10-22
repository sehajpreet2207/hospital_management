const router = require('express').Router();
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Medicine = require('../models/Medicine');
const Staff = require('../models/Staff');
const MedicalRecord = require('../models/MedicalRecord');
const { asyncHandler, protect } = require('../middleware/auth');
const { localDate } = require('../utils');

router.use(protect);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const today = localDate();
    const role = req.user.role;

    if (role === 'patient') {
      const pid = req.patient?._id;
      const [upcoming, records, unpaid] = await Promise.all([
        Appointment.find({ patient: pid, status: 'Scheduled', date: { $gte: today } })
          .populate('doctor', 'name specialization').sort({ date: 1, time: 1 }),
        MedicalRecord.countDocuments({ patient: pid }),
        Bill.find({ patient: pid, status: 'Unpaid' }),
      ]);
      return res.json({
        role, upcoming, records,
        unpaidCount: unpaid.length,
        unpaidAmount: unpaid.reduce((s, b) => s + b.total, 0),
      });
    }

    if (role === 'doctor') {
      const did = req.doctor?._id;
      const [todayList, upcomingCount, seen, patients] = await Promise.all([
        Appointment.find({ doctor: did, date: today }).populate('patient', 'name patientId gender dob').sort({ time: 1 }),
        Appointment.countDocuments({ doctor: did, status: 'Scheduled', date: { $gt: today } }),
        MedicalRecord.countDocuments({ doctor: did }),
        MedicalRecord.distinct('patient', { doctor: did }),
      ]);
      return res.json({ role, today: todayList, upcomingCount, seen, patientCount: patients.length });
    }

    // admin and receptionist
    const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00`);
    const weekAgo = new Date(Date.now() - 6 * 86400000);
    weekAgo.setHours(0, 0, 0, 0);

    const [patients, doctors, staff, todayAppts, unpaid, revenueMonth, lowStock, daily, byDept, pendingRx] =
      await Promise.all([
        Patient.countDocuments(),
        Doctor.countDocuments(),
        Staff.countDocuments({ status: { $ne: 'Inactive' } }),
        Appointment.find({ date: today })
          .populate('patient', 'name patientId').populate('doctor', 'name specialization').sort({ time: 1 }),
        Bill.aggregate([{ $match: { status: 'Unpaid' } }, { $group: { _id: null, n: { $sum: 1 }, amt: { $sum: '$total' } } }]),
        Bill.aggregate([{ $match: { status: 'Paid', paidAt: { $gte: monthStart } } }, { $group: { _id: null, amt: { $sum: '$total' } } }]),
        Medicine.find({ $expr: { $lte: ['$stock', '$reorderLevel'] } }).sort({ stock: 1 }).limit(6),
        Bill.aggregate([
          { $match: { status: 'Paid', paidAt: { $gte: weekAgo } } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: '+05:30' } }, amt: { $sum: '$total' } } },
        ]),
        Appointment.aggregate([
          { $match: { date: { $gte: localDate(new Date(Date.now() - 29 * 86400000)) } } },
          { $lookup: { from: 'doctors', localField: 'doctor', foreignField: '_id', as: 'd' } },
          { $unwind: '$d' },
          { $group: { _id: '$d.specialization', n: { $sum: 1 } } },
          { $sort: { n: -1 } },
        ]),
        MedicalRecord.countDocuments({ dispensed: false, 'prescriptions.0': { $exists: true } }),
      ]);

    // fill the last 7 days so empty days show as zero
    const revenue7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = localDate(new Date(Date.now() - i * 86400000));
      revenue7.push({ date: d, amount: daily.find((x) => x._id === d)?.amt || 0 });
    }

    res.json({
      role, patients, doctors, staff,
      today: todayAppts,
      unpaidCount: unpaid[0]?.n || 0,
      unpaidAmount: unpaid[0]?.amt || 0,
      revenueMonth: revenueMonth[0]?.amt || 0,
      lowStock, revenue7, byDept, pendingRx,
    });
  })
);

module.exports = router;
