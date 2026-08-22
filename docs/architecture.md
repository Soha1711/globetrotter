# GlobeTrotter - System Architecture & Design Notes

GlobeTrotter is a personalized multi-city travel planning web application built as a full-stack JavaScript monorepo.

## System Overview

```
 ┌─────────────────────────┐               ┌─────────────────────────┐               ┌─────────────────────────┐
 │   React Client (Vite)   │  HTTP / REST  │  Express API Server     │   Prisma ORM    │  PostgreSQL Database    │
 │   Port 5173             │  ───────────> │  Port 5000              │  ────────────>  │  Port 5432              │
 │  (TailwindCSS, Router)  │ <───────────  │  (JWT Auth, Controllers)│ <────────────   │  (Relational Data)      │
 └─────────────────────────┘               └─────────────────────────┘               └─────────────────────────┘
```

## Key Architectural Principles

1. **Client Layer (`/client`)**:
   - Single Page Application (SPA) powered by React & Vite.
   - Client-side routing managed via `react-router-dom` (v6).
   - Component utility styling powered by TailwindCSS.
   - Communicates with API server using standard `fetch` or `axios` configured via `VITE_API_BASE_URL`.

2. **Server Layer (`/server`)**:
   - RESTful Express API backend running on Node.js.
   - Modular MVC structure: Routes (`/src/routes`), Controllers (`/src/controllers`), Middleware (`/src/middleware`).
   - Authentication using JSON Web Tokens (JWT) signed with bcrypt hashed user passwords.
   - Data access abstraction powered by Prisma ORM (`/src/prisma/schema.prisma`).

3. **Database Layer**:
   - PostgreSQL relational database for structured storing of Users, Multi-City Trips, Itinerary Destinations, and Preferences.
