# College Event Manager

A full-stack college event management application built with Node.js, Express, MongoDB, Bootstrap 5, and JWT-based authentication.

## Features

- Student and admin authentication
- Event creation, editing, deletion, and filtering
- Student registration and cancellation
- Participant tracking and CSV export
- Announcements with priority levels
- Dashboard summary cards and role-specific views
- Modular REST API structure

## Project Structure

- `config` — database configuration
- `controllers` — business logic for auth, events, announcements, and dashboard
- `middleware` — JWT authentication and role checks
- `models` — Mongoose schemas
- `public` — CSS and frontend scripts
- `routes` — API endpoints
- `views` — HTML pages
- `server.js` — entry point

## Installation

1. Open a terminal in the project folder.
2. Run:
   ```bash
   npm install
   ```
3. Create a `.env` file or update the existing one:
   ```env
   PORT=3000
   JWT_SECRET=college-event-manager-secret
   MONGODB_URI=
   ```
   Leave `MONGODB_URI` empty to use the built-in in-memory MongoDB instance for local development.

## Start the app

```bash
npm start
```

For development mode:

```bash
npm run dev
```

## Demo credentials

Admin:
- Email: `admin@college.edu`
- Password: `admin123`

Student:
- Email: `student@college.edu`
- Password: `student123`

## Configuration Notes

- If you want to use a real MongoDB database, set `MONGODB_URI` to your connection string.
- Example:
  ```env
  MONGODB_URI=mongodb://localhost:27017/college_event_manager
  ```
- The application will automatically create the database and sample data when it starts.

## Verify the app

Visit:
- `http://localhost:3000/`
- `http://localhost:3000/login`
- `http://localhost:3000/dashboard`

The app will automatically redirect unauthenticated users to the login page when they try to access the dashboard.
