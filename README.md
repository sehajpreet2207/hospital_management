# 🏥 Hospital Management System

A full-stack web application designed to simplify hospital operations, including patient management, doctor scheduling, appointments, medical records, pharmacy inventory, billing, and staff management.

## ✨ Features

* **Authentication:** Secure login and role-based access.
* **Admin Dashboard:** Manage doctors, staff, users, and medicines.
* **Patient Management:** Register patients and maintain medical details.
* **Doctor Management:** Manage profiles, specializations, and availability.
* **Appointments:** Book and manage doctor appointments.
* **Medical Records:** Maintain diagnoses, prescriptions, and patient history.
* **Pharmacy:** Manage medicines and stock.
* **Billing:** Generate and manage patient bills.

## 🛠️ Tech Stack

* **Frontend:** JavaScript, React 18, React Router, Vite, CSS
* **Backend:** JavaScript, Node.js, Express.js
* **Database:** MongoDB, Mongoose
* **Authentication:** JWT, bcryptjs
* **Other:** dotenv, CORS

## 📁 Project Structure

```text
hospital-management-system/
├── client/       # React frontend
├── server/       # Express backend
├── package.json
├── render.yaml
└── README.md
```

## 🚀 Getting Started

**Prerequisites:** Node.js 18+ and npm.

**1. Clone the repository**

```bash
git clone https://github.com/sehajpreet2207/hospital_management.git
cd hospital_management
```

**2. Install dependencies**

```bash
npm run install-all
```

**3. Configure environment variables**

Create `server/.env` and configure your MongoDB connection and JWT secret as required.

**4. Start the application**

```bash
npm run dev
```

Open the frontend URL displayed in your terminal, usually `http://localhost:5173`.

## 🔑 Demo Accounts

| Role         | Email               | Password       |
| ------------ | ------------------- | -------------- |
| Admin        | `admin@hms.com`     | `admin123`     |
| Receptionist | `reception@hms.com` | `reception123` |
| Doctor       | `ramesh@hms.com`    | `doctor123`    |
| Patient      | `riyash@hms.com`    | `patient123`   |

*Demo credentials are based on earlier project documentation. They may differ from your current database seed data.*

## 👨‍💻 Project Details

**Project:** Hospital Management System
**Type:** Full-Stack Web Application
**Repository:** [hospital_management](https://github.com/sehajpreet2207/hospital_management)

---

*Developed as a practical project to streamline hospital management and healthcare workflows.*
