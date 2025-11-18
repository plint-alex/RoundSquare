# The Last of Guss - Frontend

Frontend application for "The Last of Guss" game built with Vite, React, TypeScript, and Zustand.

## Tech Stack

- **Framework**: React 19+ with TypeScript (strict mode)
- **Build Tool**: Vite 7+
- **Routing**: React Router v7+
- **State Management**: Zustand 5+
- **Styling**: CSS Modules with CSS Variables (light/dark mode support)
- **Testing**: Vitest + React Testing Library
- **API Client**: Fetch API with typed wrappers
- **Linting**: ESLint + Prettier

## Architecture Decisions

### State Management: Zustand

We chose **Zustand** for state management because:
- **Simplicity**: Minimal boilerplate compared to Redux
- **Lightweight**: Small bundle size (~1KB)
- **TypeScript Support**: Excellent type inference and safety
- **Flexibility**: Easy to extend and works well with React hooks
- **Persistence**: Built-in support for localStorage persistence

The auth store (`src/store/authStore.ts`) manages authentication state and provides actions for login/logout.

### Styling: CSS Modules + CSS Variables

We use **CSS Modules** with **CSS Variables** for styling because:
- **Maintainability**: Clear component-scoped styles
- **Theme Support**: CSS variables enable easy light/dark mode switching
- **Performance**: No runtime CSS-in-JS overhead
- **Simplicity**: Standard CSS with good tooling support
- **Responsive**: Mobile-first approach with CSS variables for breakpoints

Global styles and variables are defined in `src/ui/global.css`.

### API Client: Fetch with Typed Wrappers

We use the native **Fetch API** with typed wrappers because:
- **Native**: No additional dependencies
- **Type Safety**: TypeScript types for all API responses
- **Cookie Support**: Built-in credentials handling for session cookies
- **Error Handling**: Centralized error parsing and formatting
- **Simplicity**: Easy to understand and extend

API client is in `src/api/client.ts` with auth-specific functions in `src/api/auth.ts`.

## Project Structure

```
frontend/
  src/
    api/              # API client, request helpers, types
      client.ts       # Typed fetch wrapper
      auth.ts         # Auth API functions
      types.ts        # API response types
    components/       # Reusable UI components
      LoginForm.tsx   # Login form component
      ProtectedRoute.tsx  # Protected route wrapper
      __tests__/      # Component tests
    pages/            # Route components
      LoginPage.tsx   # Login page
      RoundsPage.tsx  # Rounds list (placeholder)
    hooks/            # Custom React hooks
      useAuth.ts      # Auth hook wrapper
    store/            # Zustand stores
      authStore.ts    # Auth state management
    ui/               # Design system tokens, themes
      global.css      # Global styles and CSS variables
    test/             # Test setup and utilities
      setup.ts        # Vitest setup file
    App.tsx           # Router setup
    main.tsx          # Entry point
  .env.example        # Environment variables template
  .env                # Local environment (gitignored)
  vitest.config.ts    # Vitest configuration
  vite.config.ts      # Vite configuration
  tsconfig.json       # TypeScript configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see backend README)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Configure environment variables (see [Environment Variables](#environment-variables))

### Running the Application

- **Development**: `npm run dev` - Starts Vite dev server (usually on http://localhost:5173)
- **Build**: `npm run build` - Creates production build in `dist/`
- **Preview**: `npm run preview` - Preview production build locally
- **Lint**: `npm run lint` - Run ESLint
- **Test**: `npm test` - Run tests
- **Test (Watch)**: `npm run test:watch` - Run tests in watch mode

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

- `VITE_API_BASE_URL`: Backend API base URL (default: `http://localhost:3000`)

**Note**: Environment variables must be prefixed with `VITE_` to be accessible in the application.

## API Integration

### Authentication

The app uses cookie-based authentication. The backend sets an httpOnly cookie named `session` on successful login.

#### Login Endpoint

- **URL**: `POST /api/auth/login`
- **Request**: `{ username: string, password: string }`
- **Success (200)**: Returns `{ id: string, username: string, role: 'ADMIN' | 'SURVIVOR' | 'NIKITA' }` and sets session cookie
- **Error (400)**: Returns `{ error: { code: string, message: string } }`

#### Current User Endpoint

- **URL**: `GET /api/auth/me`
- **Success (200)**: Returns user object if authenticated
- **Error (401)**: Returns error if not authenticated

### Usage Example

```typescript
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

// Login
const user = await login('username', 'password')
useAuthStore.getState().login(user)

// Access auth state
const { user, isAuthenticated } = useAuthStore()

// Logout
useAuthStore.getState().logout()
```

## Path Aliases

The project uses path aliases for cleaner imports:

- `@/` → `src/`

Example:
```typescript
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
```

## Testing

Tests are written with Vitest and React Testing Library. Example:

```typescript
import { render, screen } from '@testing-library/react'
import { LoginForm } from '@/components/LoginForm'

describe('LoginForm', () => {
  it('should disable submit when fields are empty', () => {
    render(<LoginForm />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

Run tests:
- `npm test` - Run once
- `npm run test:watch` - Watch mode

## Development Guidelines

### Component Structure

- Keep components small and focused (<200 LOC)
- Use TypeScript strict mode
- Extract reusable logic into custom hooks
- Use CSS Modules for component styling
- Follow mobile-first responsive design

### Code Style

- Use Prettier for formatting (`npm run lint` checks formatting)
- Follow ESLint rules
- Use functional components and hooks
- Prefer named exports for components

### State Management

- Use Zustand stores for global state
- Keep component state local when possible
- Use custom hooks for reusable state logic

## Next Steps

After completing F01 (Auth UI & Bootstrap), the following tasks are planned:

- **F02**: Rounds list view (lobby)
- **F03**: Round detail view with goose interaction
- **F04**: State synchronization and real-time updates
- **F05**: Admin round creation
- **F06**: Design system and accessibility improvements

## Troubleshooting

### CORS Issues

If you encounter CORS errors, ensure the backend is configured to allow credentials and the frontend origin.

### Cookie Not Set

Check that:
1. Backend sets cookies with `SameSite` and `Secure` attributes correctly
2. Frontend uses `credentials: 'include'` in API requests
3. Both frontend and backend are on compatible origins

### Path Alias Not Working

Ensure `tsconfig.app.json` has path aliases configured and Vite's `vite.config.ts` has matching resolve aliases.

## License

See main project README for license information.
