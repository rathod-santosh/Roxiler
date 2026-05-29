# Store Rating System

An industry-level FullStack web application where users can discover registered stores, view ratings, submit feedback, and manage stores. Designed with Node/Express.js backend, MySQL database, and React.js frontend using custom glassmorphic styling (Vanilla CSS).

---

## Key Features

1. **Role-Based Access Control**:
   - **System Administrator**: Can add users/stores, view advanced statistics (totals), filter directories, and view details (including individual reviews logs).
   - **Normal User**: Can register, search stores, review overall averages, submit feedback, modify their rating (1-5 stars), and change password.
   - **Store Owner**: Has a store-focused overview showing their aggregate score and a sortable log of all users who rated their business.
2. **Strict Validations**:
   - **Name**: Between 20 and 60 characters.
   - **Address**: Up to 400 characters.
   - **Password**: 8-16 characters, containing at least one uppercase letter and one special character (e.g. `!@#$%^&*`).
3. **Advanced Table Controls**: Support sorting (Asc/Desc) and multi-field filtering.

---

## Installation & Setup

### 1. Configure the Database Connection
1. Open [backend/.env](file:///C:/Users/Vishwatej/Downloads/Roxiler%20Systems/backend/.env).
2. Update the `DB_PASSWORD` (and `DB_USER`/`DB_HOST`/`DB_PORT` if your local MySQL settings differ) to match your local setup.

### 2. Auto-initialize & Seed the Database
From the root workspace, navigate to the `backend` folder and run the database setup script. This script automatically creates the `store_rating_db` database and its tables, and seeds it with demo accounts:

```bash
cd backend
npm run db:setup
```

### 3. Start the Backend API Server
Launch the backend server using the development start script:
```bash
npm run dev
```
The backend server runs on: **http://localhost:5000**

### 4. Start the Frontend React App
Open a new terminal window, navigate to the `frontend` folder, and run:
```bash
cd frontend
npm run dev
```
The Vite development server runs on: **http://localhost:5173**

---

## Seed Accounts for Testing

All seeded accounts share the password: **`Password123!`** (12 characters, uppercase 'P', special char '!').

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

## Form Validations Quick Reference

Forms will show immediate visual warnings and error logs when input requirements are not met:
- **Names** must have **at least 20 characters** (e.g., *John Doe Customer Account*).
- **Passwords** must be **8 to 16 characters**, with at least 1 uppercase and 1 special symbol (e.g. *Password123!*).
- **Email** must conform to standard conventions.
- **Address** is capped at **400 characters**.
