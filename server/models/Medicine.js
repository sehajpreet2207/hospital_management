const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Tablet' },
    manufacturer: String,
    stock: { type: Number, default: 0, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    reorderLevel: { type: Number, default: 20 },
    expiryDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
