# The Last of Guss (Round Square)

A browser-based competitive tapping game where players compete to tap a virtual goose as many times as possible within active rounds.

## 🎮 Game Overview

**The Last of Guss** is a real-time multiplayer game where players tap a virtual goose to earn points. The game features:

- **Rounds System**: Time-limited rounds with cooldown periods
- **Scoring**: 1 point per tap, with 10 points for every 11th tap
- **User Roles**: Admin (can create rounds), Survivor (regular players), and Nikita (special role)
- **Real-time Updates**: Live score tracking and round status updates

## 🏗️ Project Structure

```
RoundSquare/
├── backend/          # Node.js + Fastify + PostgreSQL backend
├── frontend/         # React + Vite frontend
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 12+ (for database)
- **Git** (for cloning the repository)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=3000
   NODE_ENV=development
   ROUND_DURATION=60
   COOLDOWN_DURATION=30
   DATABASE_URL=postgresql://postgres:password@localhost:5432/the_last_of_guss
   AUTH_SECRET=your-secret-key-here-min-32-chars
   ```

4. Set up the database:
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Run migrations
   npm run db:migrate:dev
   
   # Seed with sample data
   npm run db:seed
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

The backend will start on `http://localhost:3000` (or the port specified in `.env`).

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on `http://localhost:5173` (or the next available port).

## 📚 Documentation

- **[Backend README](backend/README.md)** - Detailed backend documentation, API endpoints, database setup
- **[Frontend README](frontend/README.md)** - Frontend architecture, components, and development guide
- **[Technical Task](Technical%20task.md)** - Original project requirements and specifications

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Fastify 4+
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 12+
- **ORM**: Prisma 5+
- **Authentication**: JWT (httpOnly cookies)
- **Testing**: Vitest

### Frontend
- **Framework**: React 19+ with TypeScript
- **Build Tool**: Vite 7+
- **Routing**: React Router v7+
- **State Management**: Zustand 5+
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: CSS Modules with CSS Variables
- **Testing**: Vitest + React Testing Library

## 🎯 Key Features

### Game Mechanics
- **Round Lifecycle**: Automatic transitions between COOLDOWN → ACTIVE → COMPLETED
- **Tap Batching**: Frontend batches taps and sends updates every second for better performance
- **Score Calculation**: Frontend calculates scores locally, backend validates and stores
- **11th Tap Bonus**: Every 11th tap awards 10 points instead of 1

### User Roles
- **ADMIN**: Can create new rounds
- **SURVIVOR**: Regular players who can tap and see their scores
- **NIKITA**: Special role - taps are recorded but score always displays as 0

### Real-time Features
- Live round status updates
- Real-time score tracking
- Automatic round state transitions
- Optimistic UI updates for responsive tapping

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login or create user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Rounds
- `GET /api/rounds` - List all rounds (optional `?status=ACTIVE` filter)
- `GET /api/rounds/:id` - Get round details
- `POST /api/rounds` - Create new round (Admin only)
- `POST /api/rounds/:id/tap` - Tap the goose (sends `{ tapCount, score }`)

### Health
- `GET /healthz` - Health check endpoint

See [Backend README](backend/README.md) for detailed API documentation.

## 🗄️ Database Schema

The database consists of three main tables:

- **users** - User accounts with roles (ADMIN, SURVIVOR, NIKITA)
- **rounds** - Game rounds with cooldown, start, and end times
- **round_participants** - Participant statistics per round

See `backend/prisma/schema.prisma` for the complete schema definition.

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

### Frontend Tests
```bash
cd frontend
npm test              # Run tests once
npm run test:watch    # Run tests in watch mode
```

## 🏃 Development Workflow

1. **Start PostgreSQL** (if not running as a service)
2. **Start Backend**: `cd backend && npm run dev`
3. **Start Frontend**: `cd frontend && npm run dev`
4. **Access Application**: Open `http://localhost:5173` in your browser

### Default Test Users

After seeding the database, you can use:

- **Admin**: `admin` / `password`
- **Survivor**: `survivor1` / `password`
- **Nikita**: `nikita` / `password`

**⚠️ Warning**: Change default passwords in production!

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build    # Compile TypeScript
npm start        # Run production server
```

### Frontend
```bash
cd frontend
npm run build    # Build for production
npm run preview  # Preview production build locally
```

The production build will be in `frontend/dist/`.

## 🔧 Configuration

### Environment Variables

#### Backend (`.env`)
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `ROUND_DURATION` - Round duration in seconds (default: 60)
- `COOLDOWN_DURATION` - Cooldown period in seconds (default: 30)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - JWT secret (min 32 characters)

#### Frontend (`.env`)
- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3000)

## 🏛️ Architecture

The project follows **Domain-Driven Design (DDD)** principles with clean architecture:

- **Domain Layer**: Core business logic, entities, and value objects
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: HTTP adapters, database adapters, external services
- **Shared Layer**: Cross-cutting concerns (config, logging)

### Backend Architecture
```
backend/src/
├── domain/          # Domain entities and repositories
├── app/             # Application services (use cases)
├── infra/           # Infrastructure (HTTP, DB)
└── shared/          # Shared utilities
```

### Frontend Architecture
```
frontend/src/
├── api/             # API client and types
├── components/      # Reusable UI components
├── pages/           # Route components
├── hooks/           # Custom React hooks
├── store/           # Zustand stores
└── utils/           # Utility functions
```

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error**
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `npm run db:migrate:dev`

**Port Already in Use**
- Change `PORT` in `.env` or kill the process using port 3000

### Frontend Issues

**CORS Errors**
- Ensure backend is running
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify Vite proxy configuration in `vite.config.ts`

**Cookie Not Set**
- Ensure both frontend and backend are on compatible origins
- Check browser console for cookie-related errors

## 📝 Development Guidelines

- Keep files under 150-200 LOC when possible
- Follow SOLID principles
- Write tests for new features
- Use TypeScript strict mode
- Follow existing code style (enforced by ESLint and Prettier)
- Use meaningful commit messages

## 📄 License

ISC

## 👥 Contributing

This is a private project. For questions or issues, please contact the project maintainers.

---

**Happy Tapping! 🦢**

