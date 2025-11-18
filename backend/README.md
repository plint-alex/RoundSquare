# The Last of Guss - Backend

Backend service for "The Last of Guss" game built with Fastify, TypeScript, and PostgreSQL.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL 12+ (for database)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
ROUND_DURATION=60
COOLDOWN_DURATION=30
DATABASE_URL=postgresql://user:password@localhost:5432/the_last_of_guss
```

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations to create database schema
npm run db:migrate:dev

# Seed the database with sample data
npm run db:seed
```

## Database Setup

### Prisma ORM

This project uses [Prisma](https://www.prisma.io/) as the ORM for database access.

### Available Database Scripts

- `npm run db:generate` - Generate Prisma Client from schema
- `npm run db:migrate` - Run pending migrations (production)
- `npm run db:migrate:dev` - Create and apply a new migration (development)
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed the database with sample data

### Database Schema

The database consists of three main tables:

- **users** - User accounts with roles (ADMIN, SURVIVOR, NIKITA)
- **rounds** - Game rounds with cooldown, start, and end times
- **round_participants** - Participant statistics per round

See the ERD diagram in `docs/agile/agents/agent1/B02-data-modeling/erd.md` for detailed schema information.

### Seed Data

The seed script creates:
- Admin user (username: `admin`, password: `password`)
- Survivor user (username: `survivor1`, password: `password`)
- Nikita user (username: `nikita`, password: `password`)
- One sample round in COOLDOWN status

**Note**: Change default passwords in production!

## Available Scripts

- `npm run dev` - Start development server with hot reload (using tsx)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production server
- `npm run lint` - Run ESLint to check code quality
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode

## Running the Server

### Development Mode
```bash
npm run dev
```

The server will start on the port specified in your `.env` file (default: 3000).

### Production Mode
```bash
npm run build
npm start
```

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma     # Prisma schema definition
│   └── seed.ts           # Database seed script
├── src/
│   ├── app/              # Application services (use cases)
│   ├── domain/           # Domain entities and value objects
│   │   ├── users/        # User domain entities
│   │   ├── rounds/       # Round domain entities
│   │   └── repositories/ # Repository interfaces
│   ├── infra/
│   │   ├── http/         # Fastify routes and plugins
│   │   └── db/           # Database adapters and repositories
│   │       ├── client.ts # Prisma client singleton
│   │       ├── mappers/  # Prisma to domain mappers
│   │       └── repositories/ # Prisma repository implementations
│   └── shared/           # Shared utilities (config, logger)
├── tests/                # Test files mirroring src structure
├── dist/                 # Compiled JavaScript (generated)
└── package.json
```

## Architecture

This project follows Domain-Driven Design (DDD) principles with clean architecture:

- **Domain Layer** (`src/domain/`): Core business logic, entities, and value objects
- **Application Layer** (`src/app/`): Use cases and application services
- **Infrastructure Layer** (`src/infra/`): HTTP adapters, database adapters, external services
- **Shared Layer** (`src/shared/`): Cross-cutting concerns (config, logging)

## Health Endpoint

The server exposes a health check endpoint:

```bash
GET /healthz
```

Returns:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 123,
  "environment": "development",
  "timestamp": "2025-11-17T12:00:00.000Z"
}
```

## Authentication

### Session Strategy

The application uses JWT (JSON Web Tokens) stored in httpOnly cookies for session management. This approach provides:

- **Security**: httpOnly cookies prevent XSS attacks
- **Stateless**: JWT tokens contain user information, reducing database lookups
- **Scalable**: Works across multiple server instances

### Authentication Endpoints

#### POST /api/auth/login

Logs in a user or creates a new user if they don't exist.

**Request:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response (200):**
```json
{
  "id": "user-uuid",
  "username": "admin",
  "role": "ADMIN"
}
```

**Behavior:**
- If user doesn't exist: Creates new user, derives role from username, returns user info and sets session cookie
- If user exists: Validates password, returns user info and sets session cookie
- If password is wrong: Returns 400 error

**Role Derivation:**
- `admin` (case-insensitive) → ADMIN role
- `nikita` (case-insensitive) → NIKITA role
- All other usernames → SURVIVOR role

#### GET /api/auth/me

Returns the currently authenticated user's information.

**Response (200):**
```json
{
  "id": "user-uuid",
  "username": "admin",
  "role": "ADMIN"
}
```

**Error (401):**
```json
{
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Authentication required"
  }
}
```

### Cookie Configuration

- **Name**: Configurable via `AUTH_COOKIE_NAME` (default: `session`)
- **httpOnly**: `true` (prevents JavaScript access)
- **secure**: `true` in production (HTTPS only)
- **sameSite**: `strict` (CSRF protection)
- **maxAge**: Configurable via `AUTH_COOKIE_MAX_AGE` (default: 24 hours)

### Generating AUTH_SECRET

The `AUTH_SECRET` environment variable must be at least 32 characters long. Generate a secure secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### Security Considerations

- **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
- **Token Expiration**: JWT tokens expire after the configured `AUTH_COOKIE_MAX_AGE` (default: 24 hours)
- **No Password Logging**: Passwords are never logged; sensitive fields are scrubbed from logs
- **Strong Secrets**: `AUTH_SECRET` must be at least 32 characters and should be unique per environment

### Example Usage

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# Get current user (cookies automatically sent)
curl http://localhost:3000/api/auth/me -b cookies.txt
```

## Round Lifecycle

### Overview

Rounds automatically transition through three states:
1. **COOLDOWN** - Period between creation and start time
2. **ACTIVE** - Round is in progress, players can tap
3. **COMPLETED** - Round has ended

### Lifecycle Worker

A background worker automatically updates round statuses based on timestamps. The worker:
- Polls every second (configurable via `LIFECYCLE_POLL_MS`)
- Updates rounds from COOLDOWN → ACTIVE when start time is reached
- Updates rounds from ACTIVE → COMPLETED when end time is reached
- Runs automatically as part of the main server process
- Is idempotent and safe for concurrent execution across multiple instances

### Round Endpoints

#### GET /api/rounds

Returns a list of all rounds, ordered by start time (newest first).

**Query Parameters:**
- `status` (optional): Filter rounds by status (`COOLDOWN`, `ACTIVE`, `COMPLETED`)
- `pagination` (optional): Reserved for future pagination support (currently ignored)

**Response (200):**
```json
[
  {
    "id": "round-uuid",
    "status": "ACTIVE",
    "cooldownStartAt": "2025-11-17T12:00:00.000Z",
    "cooldownEndsAt": "2025-11-17T12:00:30.000Z",
    "startAt": "2025-11-17T12:00:30.000Z",
    "endAt": "2025-11-17T12:01:30.000Z",
    "totalPoints": 150,
    "timeUntilStart": null,
    "timeRemaining": 45
  }
]
```

**Examples:**
```bash
# Get all rounds
curl http://localhost:3000/api/rounds

# Get only active rounds
curl http://localhost:3000/api/rounds?status=ACTIVE

# Get rounds in cooldown
curl http://localhost:3000/api/rounds?status=COOLDOWN
```

#### GET /api/rounds/:id

Returns detailed information about a specific round, including winner if completed.

**Response (200):**
```json
{
  "id": "round-uuid",
  "status": "COMPLETED",
  "cooldownStartAt": "2025-11-17T12:00:00.000Z",
  "cooldownEndsAt": "2025-11-17T12:00:30.000Z",
  "startAt": "2025-11-17T12:00:30.000Z",
  "endAt": "2025-11-17T12:01:30.000Z",
  "totalPoints": 150,
  "timeUntilStart": null,
  "timeRemaining": null,
  "winner": {
    "userId": "user-uuid",
    "username": "player1",
    "score": 100
  }
}
```

#### POST /api/rounds

Creates a new round. **Admin only.**

**Request Body (optional):**
```json
{
  "startDelaySeconds": 60
}
```

- `startDelaySeconds` (optional): Override the cooldown duration in seconds. Must be a non-negative number. If not provided, uses `COOLDOWN_DURATION` from config.

**Response (201):**
```json
{
  "id": "round-uuid",
  "status": "COOLDOWN",
  "cooldownStartAt": "2025-11-17T12:00:00.000Z",
  "cooldownEndsAt": "2025-11-17T12:01:00.000Z",
  "startAt": "2025-11-17T12:01:00.000Z",
  "endAt": "2025-11-17T12:02:00.000Z",
  "totalPoints": 0,
  "timeUntilStart": 60,
  "timeRemaining": null
}
```

**Timestamps:**
- `cooldownStartAt`: When the round was created
- `cooldownEndsAt`: When the cooldown period ends (equals `startAt`)
- `startAt`: `cooldownStartAt + startDelaySeconds` (or `COOLDOWN_DURATION` from config if not provided)
- `endAt`: `startAt + ROUND_DURATION` (from config)

**Examples:**
```bash
# Create round with default cooldown duration (from config)
curl -X POST http://localhost:3000/api/rounds \
  -H "Content-Type: application/json" \
  -b cookies.txt

# Create round with custom 60-second cooldown
curl -X POST http://localhost:3000/api/rounds \
  -H "Content-Type: application/json" \
  -d '{"startDelaySeconds": 60}' \
  -b cookies.txt
```

**Error Responses:**
- `400`: Invalid request body (e.g., negative `startDelaySeconds` or non-number value)
- `401`: Authentication required
- `403`: Only admins can create rounds

### Multi-Instance Deployment

The lifecycle worker is designed to run safely on multiple instances:
- Status updates use database-level atomic operations
- Worker can run on all instances or a single instance
- No distributed locks required (database handles concurrency)
- Status is computed from timestamps, ensuring consistency

**Configuration:**
- `LIFECYCLE_POLL_MS`: Polling interval in milliseconds (default: 1000ms = 1 second)
- Worker starts automatically with the server
- To disable worker on specific instances, you can modify the startup code

## Development Guidelines

- Keep files under 150 LOC when possible
- Follow SOLID principles
- Write tests for new features
- Use TypeScript strict mode
- Follow the existing code style (enforced by ESLint and Prettier)

## License

ISC

