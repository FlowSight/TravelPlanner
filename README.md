# Travel Planner

A full-stack web app for planning trips with day-wise itineraries, notes, documents, and member collaboration.

## Tech Stack

- **Frontend:** React + Fluent UI v9 + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas (native mongodb driver)
- **Auth:** JWT (JSON Web Tokens)

## Project Structure

```
TravelPlanner/
├── backend/
│   ├── src/
│   │   ├── config/db.js        # MongoDB connection
│   │   ├── middleware/auth.js   # JWT auth & role middleware
│   │   ├── models/              # Data access modules (User, Place, Trip)
│   │   ├── routes/              # API routes (auth, places, trips, users)
│   │   ├── scripts/seedPlaces.js # Seed DB with Thailand places data
│   │   └── server.js            # Express entry point
│   ├── .env                     # Environment variables (not committed)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/          # Navbar, ProtectedRoute
│   │   ├── context/             # AuthContext (React Context)
│   │   ├── pages/               # Login, Register, Places, Trips, TripDetail, AdminPlaces
│   │   ├── services/api.js      # Axios API client
│   │   ├── App.jsx              # Router setup
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Raw plans/                   # Original trip research documents
├── project_plan.md              # Original project requirements
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas cluster (connection string in backend/.env)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env     # Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed             # Seed the database with places data + admin user
npm run dev              # Start dev server on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev              # Start Vite dev server on port 3000
```

### 3. Open the App

Visit **http://localhost:3000** in your browser.

## Default Accounts (after seeding)

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@travelplanner.com  | admin123  |

Register a new account to use as a regular user.

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get current user

### Places (public read, admin write)
- `GET    /api/places` — List places (filterable: ?country=&city=&type=&search=)
- `GET    /api/places/:id` — Get single place
- `POST   /api/places` — Create place (admin)
- `PUT    /api/places/:id` — Update place (admin)
- `DELETE /api/places/:id` — Delete place (admin)

### Trips (authenticated, member-restricted)
- `GET    /api/trips` — List user's trips
- `GET    /api/trips/:id` — Get trip details
- `POST   /api/trips` — Create trip
- `PUT    /api/trips/:id` — Update trip (editors only)
- `DELETE /api/trips/:id` — Delete trip (owner only)
- `POST   /api/trips/:id/members` — Add member (owner only)
- `DELETE /api/trips/:id/members/:userId` — Remove member (owner only)

### Users
- `GET /api/users/search?q=` — Search users (for adding trip members)
- `GET /api/users` — List all users (admin only)

## Features

- **User auth** with email/phone + password (JWT)
- **Places database** with metadata (type, fee, timing, notes, Google Maps URL)
- **Trip planning** with day-wise itinerary, activities, notes, and document links
- **Member access control** — only trip members can view/edit
- **Admin panel** for managing places
- **Fluent UI** design system throughout
