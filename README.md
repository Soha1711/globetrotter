# GlobeTrotter 🌍✈️

> **Personalized Multi-City Travel Planning Web Application**

GlobeTrotter is a full-stack web application designed to help travelers plan, organize, and experience seamless multi-city itineraries tailored to their budget, pacing, and preferences.

Repository Maintained by: [Soha1711](https://github.com/Soha1711)

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, React Router v6, Lucide Icons
- **Backend**: Node.js, Express.js, CORS, dotenv, Nodemon
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **Monorepo Tooling**: Concurrently

---

## 📂 Folder Structure

```
globetrotter/
├── client/                 # React Frontend App (Vite + TailwindCSS + React Router v6)
│   ├── src/
│   │   ├── App.jsx         # Main App Component & Client Routes
│   │   ├── main.jsx        # React Entry Point
│   │   └── index.css       # Tailwind CSS setup & global styles
│   ├── package.json
│   ├── vite.config.js      # Vite dev server on port 5173 with API proxy
│   ├── tailwind.config.js
│   └── .env.example
├── server/                 # Express Backend API App
│   ├── src/
│   │   ├── controllers/    # API Request Controllers (health, auth, trips)
│   │   ├── middleware/     # Error Handling & JWT Auth Middleware
│   │   ├── routes/         # Express API Routes (e.g. GET /api/health)
│   │   ├── prisma/         # Prisma Schema (schema.prisma)
│   │   └── index.js        # Express Application Entry Point (Port 5000)
│   ├── package.json
│   ├── nodemon.json
│   └── .env.example
├── docs/                   # Documentation & Architectural Designs
│   ├── architecture.md     # System Architecture & Component Interactions
│   ├── er_diagram.md       # Entity Relationship Diagrams & Data Models
│   └── screen_list.md      # UI Screens & Route Inventory
├── .env.example            # Root Environment Variable Guidance
├── .gitignore              # Node Modules, Env files, Build artifacts
├── package.json            # Root Scripts (Concurrently runner)
└── README.md               # Project Documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have installed:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/) (v9+)
- [PostgreSQL](https://www.postgresql.org/) (running locally or remote connection)

### 2. Clone the Repository

```bash
git clone https://github.com/Soha1711/globetrotter.git
cd globetrotter
```

### 3. Environment Setup

Create local `.env` files for both server and client:

```bash
# Copy server environment variables
cp server/.env.example server/.env

# Copy client environment variables
cp client/.env.example client/.env
```

Ensure `DATABASE_URL` in `server/.env` points to your PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/globetrotter_db?schema=public"
PORT=5000
JWT_SECRET="globetrotter_super_secret_jwt_key_2026"
```

### 4. Install Dependencies

Install root, client, and server dependencies in one command:

```bash
npm run install:all
```

Or install individually:
```bash
# Root
npm install

# Server
cd server && npm install && cd ..

# Client
cd client && npm install && cd ..
```

### 5. Initialize Database Schema (Prisma)

Generate the Prisma Client and run migrations:

```bash
npm run prisma:generate
# To push schema to database:
# npm run prisma:migrate
```

### 6. Run Client and Server Concurrently

To launch both the frontend and backend servers together:

```bash
npm run dev
```

- **Frontend Client**: Runs at [http://localhost:5173](http://localhost:5173)
- **Backend API Server**: Runs at [http://localhost:5000](http://localhost:5000)
- **Health Check Endpoint**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🧪 Verification & Health Check

You can test that the backend API is operating normally by accessing:
```bash
curl http://localhost:5000/api/health
```

Expected Response (`200 OK`):
```json
{
  "status": "ok",
  "message": "GlobeTrotter API is running smoothly",
  "timestamp": "2026-08-22T08:34:44.000Z",
  "uptime": 12.34
}
```

---

## 👤 Author & Links

- **GitHub Profile**: [https://github.com/Soha1711](https://github.com/Soha1711)
- **Repository**: [GlobeTrotter](https://github.com/Soha1711/globetrotter)
