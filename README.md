# Store Rating System

An industry-level FullStack web application where users can discover registered stores, view ratings, submit feedback, and manage stores. Designed with a Node/Express.js backend, SQLite/MySQL database support, and a React.js frontend featuring custom glassmorphic styling (Vanilla CSS).

---

## 🚀 Key Features

1. **Role-Based Access Control**:
   - **System Administrator**: Can add users and stores, view advanced statistics (totals), filter directories, and view details (including individual review logs).
   - **Normal User**: Can register, search stores, review overall averages, submit feedback, modify their rating (1-5 stars), and change their password.
   - **Store Owner**: Has a store-focused overview showing their aggregate score and a sortable log of all users who rated their business.
2. **Strict Validations**:
   - **Name**: Between 20 and 60 characters.
   - **Address**: Up to 400 characters.
   - **Password**: 8-16 characters, containing at least one uppercase letter and one special character (e.g. `!@#$%^&*`).
3. **Advanced Table Controls**: Support for sorting (Ascending/Descending) and multi-field filtering.

---

## ⚙️ Installation & Setup

### 1. Configure the Environment
1. Navigate to the `backend` directory.
2. Create or modify the `.env` file (`backend/.env`).
3. Ensure your configurations match your setup (it defaults to SQLite for an immediate plug-and-play experience without installing a database server).

### 2. Auto-initialize & Seed the Database
From the root workspace, navigate to the `backend` folder, install dependencies, and run the database setup script. This script automatically creates the database, configures its tables, and seeds it with demo accounts:

```bash
cd backend
npm install
npm run db:setup
```

### 3. Start the Backend API Server
Launch the backend server using the development start script:
```bash
npm run dev
```
> **Note:** The backend server runs on: **http://localhost:5000**

### 4. Start the Frontend React App
Open a new terminal window, navigate to the `frontend` folder, install dependencies, and run:
```bash
cd frontend
npm install
npm run dev
```
> **Note:** The Vite development server runs on: **http://localhost:5173**

---

## 🔑 Seed Accounts for Testing

All seeded accounts share the following default password:  
**`Password123!`** *(12 characters, uppercase 'P', special char '!')*

- **System Administrator**: 
  - Email: `admin@storerating.com`
- **Store Owners (Registered Stores)**:
  - Starbucks Coffee: `starbucks@storerating.com`
  - McDonald's Outlet: `mcdonalds@storerating.com`
  - Walmart Supercenter: `walmart@storerating.com`
- **Normal Users (Reviewers)**:
  - John Doe: `john.doe@storerating.com`
  - Jane Smith: `jane.smith@storerating.com`
  - Bob Johnson: `bob.johnson@storerating.com`

---

## 🛡️ Form Validations Quick Reference

Forms will show immediate visual warnings and error logs when input requirements are not met:
- **Names** must have **at least 20 characters** (e.g., *John Doe Customer Account*).
- **Passwords** must be **8 to 16 characters**, with at least 1 uppercase and 1 special symbol (e.g., *Password123!*).
- **Email** must conform to standard email formatting conventions.
- **Address** is capped at a maximum of **400 characters**.

---

## 📸 Screenshots

### Login Screen
![Login Screen](screenshots/login.png)

### Rating Submission
![Rating Submission](screenshots/rating.png)

### Store Dashboard
![Store Dashboard](screenshots/store-dashboard.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin-dashboard.png)