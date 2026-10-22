const mongoose = require('mongoose');
const { nextCode } = require('./Counter');

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['Consultation', 'Pharmacy', 'Lab', 'Procedure', 'Room', 'Other'],
      default: 'Other',
    },
    quantity: { type: Number, default: 1, min: 1 },
    rate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNo: { type: String, unique: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    items: { type: [itemSchema], validate: (v) => v.length > 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    subtotal: Number,
    total: Number,
    status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Insurance', ''], default: '' },
    paidAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

billSchema.pre('save', async function (next) {
  if (!this.billNo) this.billNo = await nextCode('bill', 'BILL-');
  this.subtotal = this.items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const afterDiscount = Math.max(this.subtotal - this.discount, 0);
  this.total = Math.round(afterDiscount * (1 + this.taxPercent / 100) * 100) / 100;
  next();
});

module.exports = mongoose.model('Bill', billSchema);
