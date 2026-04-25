# Library-management-system
# Library Management System

A full-stack Library Management System developed to manage users, roles, and daily library operations efficiently. This project focuses on secure authentication, role-based access, and an organized dashboard system for different users.

## Features

- Secure Login Authentication
- Role-Based Access Control
- Admin Dashboard
- Main Branch Admin Panel
- Super Admin Panel
- Student Dashboard
- Manage Users and Permissions
- Branch Management
- Responsive Frontend Interface
- Backend API Integration
- Environment Configuration Support
- Clean Project Structure

## User Roles

### Super Admin
- Full system control
- Manage all branches
- Create/Delete Admins
- View complete reports

### Main Branch Admin
- Manage main branch operations
- Control branch records
- Monitor students and activities

### Admin
- Handle local branch tasks
- Manage users and records

### Student
- Access dashboard
- View personal details
- Use available services

## Tech Stack

### Frontend
- React.js
- HTML
- CSS
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB

## Folder Structure

```bash
librarysystem/
├── frontend/
├── backend/
│   ├── src/
│   ├── .env.example
│   └── package.json


Installation
Clone Repository
git clone https://github.com/aarti12217444/Library-management-system.git
Backend Setup
cd librarysystem/backendnpm installnpm start
Frontend Setup
cd ../frontendnpm installnpm start
Environment Variables
Create a .env file inside backend folder and add required values:
PORT=5000MONGO_URI=your_mongodb_urlJWT_SECRET=your_secret_key
Future Improvements


Notifications


Reports Export


Attendance System


Fine Management


Search & Filters


Profile Settings


Author
Aarti Kumari
Frontend Developer | Full Stack Learner | Data Enthusiast
