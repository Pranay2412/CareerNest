# CareerNest

CareerNest is a job search and recruitment web application. Students can find and apply for jobs and manage their profile; recruiters can create companies and post jobs.

## Features

- Student and recruiter registration and login
- Browse, search, and filter job listings
- Student profiles with a bio, skills, and PDF resume
- Apply for jobs and view application status
- Recruiter company management, job posting, and applicant review
- Dark-themed, responsive React interface

## Tech stack

- **Frontend:** React, Vite, Tailwind CSS, Redux Toolkit
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **Optional media storage:** Cloudinary for profile photos and company logos

## Requirements

- Node.js 18 or later and npm
- A MongoDB instance, local or hosted
- Cloudinary credentials only if you want to upload profile photos or company logos

## Setup

Open a terminal in the project directory, then install the frontend and backend dependencies:

```bash
cd frontend
npm ci
cd ../backend
npm ci
```

Create `backend/.env` with your MongoDB connection string and a private JWT signing key:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/careernest
PORT=8000
SECRET_KEY=replace-with-a-long-random-secret
```

Generate a random secret with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated value into `SECRET_KEY`. For MongoDB Atlas, use your Atlas connection string as `MONGO_URI` instead. Keep `.env` private; it is ignored by Git.

Cloudinary is optional. To enable profile photo and company logo uploads, add these values to `backend/.env`:

```dotenv
CLOUD_NAME=your-cloudinary-cloud-name
API_KEY=your-cloudinary-api-key
API_SECRET=your-cloudinary-api-secret
```

Without Cloudinary, account creation, profile updates, and company setup still work. PDF resumes are stored locally in `backend/uploads/resumes/` and are served only to their owner.

## Run locally

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). If that port is already in use, Vite may select `5174`; both ports are allowed by the backend's local CORS configuration. The frontend currently sends API requests to `http://localhost:8000`, so keep the backend on port `8000` unless you also update the API URLs in `frontend/src/utils/constant.js`.

## Usage

- Select **Student** when signing up to browse jobs, apply, and update a profile.
- Select **Recruiter** when signing up to manage companies, post jobs, and review applicants.
- Profile skills are entered as comma-separated values.
- Resumes must be valid PDF files under 10 MB.
- A recruiter must register a company before posting a job.

## API overview

All API routes are prefixed with `http://localhost:8000/api/v1`.

| Resource | Prefix | Examples |
| --- | --- | --- |
| Users | `/user` | `POST /register`, `POST /login`, `POST /profile/update`, `GET /logout` |
| Companies | `/company` | `POST /register`, `GET /get`, `PUT /update/:id` |
| Jobs | `/job` | `POST /post`, `GET /get`, `GET /get/:id` |
| Applications | `/application` | `GET /get`, `GET /apply/:id`, `POST /status/:id/update` |

Most job, company, profile, and application endpoints require the login session cookie.

## Build and lint

Build the frontend for production:

```bash
cd frontend
npm run build
```

Run the frontend ESLint check:

```bash
npm run lint
```

The backend package does not currently define an automated test suite.
