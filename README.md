

# Interview.ai – AI-Powered Interview Platform

Interview.ai is a full-stack AI-driven interview platform that enables organizations to schedule, conduct, and evaluate interviews automatically using speech recognition, AI questioning, and structured reporting.

---

## Project Structure

```
project-root/
│
├── backend/
│   ├── config/
│   ├── credentials/
│   ├── models/
│   ├── routes/
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   ├── package.json
│
├── frontend/
│
├── user_frontend/
│
└── README.md
```

---

## Prerequisites

* Node.js (v18 or later)
* MongoDB Atlas account
* Gmail account with App Password enabled
* npm or yarn

---

## Backend Environment Configuration

Create a `.env` file inside the `backend` directory.

### backend/.env

```env
PORT=8000

JWT_SECRET=your_secure_random_jwt_secret

MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/<database>?retryWrites=true&w=majority

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

```

### Notes

* Do not use your Gmail account password. Use a Gmail App Password.


---

## Backend Setup

```bash
cd backend
npm install
npm start
```

The backend will start on:

```
http://localhost:8000
```

---

## Frontend Setup (Admin / HR)

```bash
cd frontend
npm install
npm start
```

Runs on:

```
http://localhost:3000
```

---

## Frontend Setup (Candidate / User)

```bash
cd user_frontend
npm install
npm start
```

Runs on:

```
http://localhost:3001
```

---

## Core Features

* Interview session scheduling
* Secure email-based candidate validation
* Time-restricted interview access
* AI-driven question flow
* Speech-to-text and text-to-speech interaction
* Resume upload and parsing
* Automated interview reports
* JWT-based authentication
* MongoDB-based data persistence

---

## Security Practices

* Environment variables managed via `.env`
* JWT authentication for protected routes
* Google credentials stored locally and ignored in Git
* MongoDB access restricted via Atlas IP rules

---

## Production Deployment Notes

* Use separate `.env` values for production
* Enable HTTPS
* Store secrets in environment variables on the server
* Use a managed MongoDB Atlas cluster
* Configure Google Cloud IAM with minimum required permissions

---

## License

This project is intended for educational and professional use.
All rights reserved.

