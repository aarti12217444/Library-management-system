# Library Management System (MERN)

This project contains a modern full-stack library management system built with:
- MongoDB
- Express.js
- React (Vite)
- Tailwind CSS

## Project Structure

- `backend` - Express + MongoDB REST API
- `frontend` - React + Tailwind UI

## Backend Setup

1. Open `backend` folder.
2. Copy `.env.example` to `.env`.
3. Set your MongoDB connection and JWT secret in `.env`.
4. Run:

```bash
npm install
npm run dev
```

Backend runs at `http://localhost:5000`.

### Default Super Admin

When backend starts, a default Super Admin user is seeded from `.env` values:
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `SUPER_ADMIN_NAME`

You can login with those credentials to access the Super Admin dashboard.

## Frontend Setup

1. Open `frontend` folder.
2. Copy `.env.example` to `.env`.
3. Run:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Features

- Secure JWT authentication
- Role-based dashboards:
  - Super Admin
  - Branch Admin
  - Student
- Role-based API authorization and route protection
- Branch-aware book management
- Student borrow and return with loan records
- Dashboard statistics and responsive modern UI

## Main API Routes

- `POST /api/auth/login`
- `POST /api/auth/register` (student self-registration)
- `GET /api/auth/me`
- `GET /api/books`
- `POST /api/books` (super admin, branch admin)
- `DELETE /api/books/:id` (super admin, branch admin)
- `GET /api/loans`
- `POST /api/loans/borrow/:bookId` (student)
- `PATCH /api/loans/return/:loanId` (student)
- `POST /api/users/branch-admin` (super admin)
- `POST /api/users/student` (super admin, branch admin)
