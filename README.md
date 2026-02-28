# 🩺 CogniWell

CogniWell is a full-stack web application designed to support caregivers and users with cognitive challenges such as Dementia, Parkinson's disease, and vision impairments. The application provides tests, therapy sessions, and questionnaires tailored to these conditions, along with user and caregiver authentication.

---

## 🧠 Features

- **Cognitive Tests & Therapy**: Modules for dementia, Parkinson's, and vision tests and therapy activities.
- **Questionnaires**: Collects user responses that can help track progress.
- **Reporting**: User reports generated based on test results.
- **Session Management**: Game sessions are tracked and stored.
- **User Authentication**: Separate login flows for caregivers and users.
- **Role-based Authorization**: Middleware enforces access control for caregivers and users.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB

---

## 🗂️ Project Structure

```
client/              # Frontend React application using Vite
  src/
    components/      # Reusable UI components
    pages/           # Application pages (login, dashboard, tests, therapy, etc.)
    context/         # React context for global state
    utils/           # Utility functions (storage, language, etc.)

server/              # Backend Node.js/Express API
  controllers/       # Request handlers for each resource
  middlewares/       # Authentication and authorization
  models/            # Mongoose models (User, Caregiver, GameSession, etc.)
  routes/            # Express route definitions
  configs/           # Database configuration

package.json         # Root project dependencies and scripts
```

---

## 🚀Getting Started

### Prerequisites

- Node.js (>=16)
- npm or yarn
- MongoDB instance (local or Atlas)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anushka-1205/CogniWell.git
   cd CogniWell
   ```
2. Install dependencies for both client and server:
   ```bash
   cd client
   npm install
   cd ../server
   npm install
   ```
3. Configure environment variables (e.g., `MONGO_URI`, `JWT_SECRET`) in the server.
4. Start the development servers:
   ```bash
   # In one terminal
   cd server
   npm run server
   # In another terminal
   cd client
   npm run dev
   ```
Access the frontend at `http://localhost:5173` (or port from Vite config).

---

## 🔧 Scripts

- `npm run dev` (in client): Start Vite dev server.
- `npm run build` (in client): Build production bundle.
- `npm run server` (in server): Start server with nodemon.

---

## ☁️ Deployment

This project is deployed using **Vercel** and is live at:
[https://CogniWell.vercel.app](https://CogniWell.vercel.app/)

---

Author: Anushka Srivastava
