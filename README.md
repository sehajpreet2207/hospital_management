# Hospital Management System (MERN)

Professional Training I project, Department of CSE, School of Computing.

A web application that manages the daily work of a hospital out-patient department: patient registration, doctor schedules, appointment booking, consultation records with prescriptions, pharmacy stock, billing and staff. Built with MongoDB, Express, React and Node.js.

## Features by role

| Role | What they can do |
|---|---|
| Admin | Everything below, plus doctors, staff, medicine master, user accounts and deleting records |
| Front desk | Register patients, book and cancel appointments, generate bills, collect payments, issue medicines |
| Doctor | See today's OP list, write consultation notes (vitals, diagnosis, prescription), view patient history, set own OP timings |
| Patient | Self registration, book appointments with live slot availability, view own records and bills |

## Modules

1. **Patient module** - registration with auto generated IDs (P0001...), blood group, allergies, emergency contact, and a full patient file (history, appointments, bills).
2. **Doctor module** - specialization, qualification, fee, OP days and timings, availability switch.
3. **Appointment module** - 20 minute slots computed from each doctor's OP timing. Blocks past dates, non OP days, out of hours times and double booking (unique index on doctor + date + time).
4. **Medical records module** - vitals, symptoms, diagnosis, treatment and prescription. Completing a consultation marks the appointment done and raises the consultation fee bill automatically.
5. **Pharmacy module** - medicine stock with reorder level and expiry alerts. Issuing a prescription reduces stock and creates a pharmacy bill.
6. **Billing module** - itemised bills with discount and tax, payment by Cash, Card, UPI or Insurance, printable bill / receipt.
7. **Staff module** - nurses, technicians and support staff with shift and duty status.
8. **Admin module** - dashboard (today's OP list, collections for the last 7 days, visits by department, low stock), login accounts and roles.

## Tech stack

- **Frontend:** React 18, React Router, Vite, plain CSS
- **Backend:** Node.js, Express 4, JWT authentication, bcrypt password hashing
- **Database:** MongoDB with Mongoose (8 collections)

## How to run

Needs Node.js 18 or newer. Nothing else: if no MongoDB connection string is given, the server starts its own local MongoDB and keeps the data in `server/data`.

```bash
npm run install-all
npm run dev
```

Open http://localhost:5173. The first start downloads MongoDB once (about 70 MB) and fills the database with sample data.

To use MongoDB Atlas or your own MongoDB server instead, put the connection string in `server/.env`:

```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/hms
```

To reset the sample data, stop the app and run `npm run seed`.

### Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | admin@hms.com | admin123 |
| Front desk | reception@hms.com | reception123 |
| Doctor | ramesh@hms.com (any doctor's email) | doctor123 |
| Patient | riyash@hms.com / kalith@hms.com | patient123 |

The login page also has one-click buttons for these.

## Project structure

```
hospital-management-system/
├── server/
│   ├── index.js            Express app, routes, error handling
│   ├── db.js               MongoDB connection (Atlas or built-in local DB)
│   ├── seed.js             sample doctors, patients, visits, bills
│   ├── middleware/auth.js  JWT check and role based access
│   ├── models/             User, Patient, Doctor, Appointment, MedicalRecord, Bill, Medicine, Staff
│   └── routes/             one file per module
└── client/
    └── src/
        ├── App.jsx         routes with role guards
        ├── components/     layout, forms, modal, badges
        └── pages/          one page per module
```

## API summary

All routes are under `/api` and need a `Bearer` token except login and register.

| Method | Route | Purpose |
|---|---|---|
| POST | /auth/login, /auth/register | sign in, patient self registration |
| GET | /dashboard | role specific summary |
| GET POST PUT DELETE | /patients | patient records (`/patients/:id` returns the full file) |
| GET POST PUT DELETE | /doctors | doctor master, `/doctors/:id/slots?date=` for free slots |
| GET POST | /appointments | list (scoped by role) and book |
| PATCH | /appointments/:id/status | complete or cancel |
| GET POST PUT | /records | consultation records |
| POST | /records/:id/dispense | issue medicines and bill them |
| GET POST DELETE | /bills, PATCH /bills/:id/pay | billing and payment |
| GET POST PUT DELETE | /medicines, PATCH /medicines/:id/restock | pharmacy stock |
| GET POST PUT DELETE | /staff, /users | admin only |

## Production build

```bash
npm run build
npm start
```

The Express server then serves the built React app on http://localhost:5050.

## Team

- Syed Kalith
- Mohammed Riyash

Guides: Dr. Jeberson Retnaraj, Dr. A. Viji Amutha Mary

## Online demo (Render)

The repo includes `render.yaml`. On Render: **New > Blueprint**, pick this repository, and click **Apply** (leave `MONGO_URI` empty). Render builds the React app, starts the Express server and the built-in MongoDB, and loads the sample data.

On the free plan the server sleeps after 15 minutes without visits, and the first visit after that takes about a minute to wake it. Each wake-up starts again with fresh sample data. Open the link a couple of minutes before the demo.
