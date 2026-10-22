require('dotenv').config({ override: true });
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { connectDB, disconnectDB } = require('./db');

if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'hms-dev-secret';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/records', require('./routes/records'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/staff', require('./routes/staff'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Serve the built React app in production
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Turn Mongoose errors into readable messages
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate entry' });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5050;

connectDB()
  .then(async () => {
    // First run: fill the database with sample data so the app is usable straight away
    const User = require('./models/User');
    if ((await User.countDocuments()) === 0) {
      console.log('Empty database, loading sample data...');
      await require('./seed').seed();
    }
    app
      .listen(PORT, () => console.log(`API running on http://localhost:${PORT}`))
      .on('error', async (err) => {
        console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} is busy. Set another PORT in server/.env` : err.message);
        await disconnectDB();
        process.exit(1);
      });
  })
  .catch((err) => {
    console.error('Could not start:', err.message);
    process.exit(1);
  });

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    await disconnectDB();
    process.exit(0);
  });
}
