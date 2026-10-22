const mongoose = require('mongoose');

// Running counters used to build readable IDs like P0001, BILL-0001.
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

async function nextCode(name, prefix, width = 4) {
  const c = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return prefix + String(c.seq).padStart(width, '0');
}

module.exports = { Counter, nextCode };
