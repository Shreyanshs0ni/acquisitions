# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Express.js REST API using ES modules with Neon PostgreSQL database and Drizzle ORM. JWT-based authentication with HTTP-only cookies.

## Commands

```bash
# Development (local)
npm run dev          # Start server with watch mode

# Development (Docker with Neon Local)
docker compose -f docker-compose.dev.yml up --build

# Production (Docker with Neon Cloud)
docker compose -f docker-compose.prod.yml up --build -d

# Linting & Formatting
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting

# Database (Drizzle)
npm run db:generate  # Generate migrations from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Open Drizzle Studio GUI
```

## Architecture

### Request Flow
Routes → Controllers → Services → Models (Drizzle schemas)

### Directory Structure
- `src/routes/` - Express route definitions (e.g., `auth.routes.js`)
- `src/controllers/` - Request handlers, validation, response formatting
- `src/services/` - Business logic, database operations
- `src/models/` - Drizzle table schemas (used by `drizzle.config.js`)
- `src/validations/` - Zod schemas for request validation
- `src/utils/` - Shared utilities (JWT, cookies, formatting)
- `src/config/` - Database connection, Winston logger
- `drizzle/` - Generated SQL migrations

### Import Aliases
Use `#` prefix aliases instead of relative paths:
```javascript
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { createUser } from '#services/auth.service.js';
import { signupSchema } from '#validations/auth.validation.js';
```

Available aliases: `#config/*`, `#controllers/*`, `#middleware/*`, `#models/*`, `#routes/*`, `#services/*`, `#utils/*`, `#validations/*`

## Key Patterns

### Adding a New Feature
1. Define Drizzle schema in `src/models/`
2. Run `npm run db:generate` then `npm run db:migrate`
3. Create Zod validation schema in `src/validations/`
4. Implement service functions in `src/services/`
5. Create controller in `src/controllers/`
6. Add routes in `src/routes/` and register in `app.js`

### Validation
Use Zod's `safeParse()` in controllers with `formatValidationError()` from `#utils/format.js` for error responses.

### Database Queries
Use Drizzle ORM query builder. Database connection is exported from `#config/database.js` as `db`.

### Logging
Use Winston logger from `#config/logger.js`. Logs written to `logs/error.log` and `logs/combined.log`.

## Code Style
- 2-space indentation, single quotes, semicolons required
- Prefer `const`, no `var`, use arrow functions
- Prefix unused parameters with `_` (e.g., `(_req, res)`)
