# Docker Setup for Acquisitions API

This document explains how to run the Acquisitions API with Docker in both development and production environments.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT                              │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  │
│  │   Express   │ ───► │ Neon Local  │ ───► │ Neon Cloud  │  │
│  │     App     │      │   (Proxy)   │      │  (Branch)   │  │
│  └─────────────┘      └─────────────┘      └─────────────┘  │
│   localhost:3000       localhost:5432       Ephemeral DB    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION                               │
│  ┌─────────────┐                           ┌─────────────┐  │
│  │   Express   │ ────────────────────────► │ Neon Cloud  │  │
│  │     App     │         Direct            │  Database   │  │
│  └─────────────┘                           └─────────────┘  │
│   your-server:3000                          neon.tech       │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A [Neon](https://neon.tech) account with a project created
- Neon API key (get from [Neon Console → Settings → API Keys](https://console.neon.tech/app/settings/api-keys))

## Quick Start

### Development (with Neon Local)

1. **Copy and configure environment file:**
   ```bash
   cp .env.development .env
   ```

2. **Edit `.env` with your Neon credentials:**
   ```env
   NEON_API_KEY=your_neon_api_key_here
   NEON_PROJECT_ID=your_neon_project_id_here
   ```

3. **Start the development environment:**
   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

4. **Access the API:**
   - API: http://localhost:3000
   - Health check: http://localhost:3000/health

5. **Stop and clean up (deletes ephemeral branch):**
   ```bash
   docker compose -f docker-compose.dev.yml down
   ```

### Production (with Neon Cloud)

1. **Copy and configure environment file:**
   ```bash
   cp .env.production .env
   ```

2. **Edit `.env` with your production credentials:**
   ```env
   DATABASE_URL=postgres://user:password@ep-xxxxx.region.aws.neon.tech/dbname?sslmode=require
   JWT_SECRET=your_secure_production_secret
   ```

3. **Start production:**
   ```bash
   docker compose -f docker-compose.prod.yml up --build -d
   ```

4. **View logs:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f
   ```

5. **Stop:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```

## Environment Variables

### Development (.env.development)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEON_API_KEY` | Neon API key for authentication | ✅ |
| `NEON_PROJECT_ID` | Your Neon project ID | ✅ |
| `PARENT_BRANCH_ID` | Parent branch for ephemeral branches | ❌ |
| `DELETE_BRANCH` | Delete branch on container stop (default: true) | ❌ |
| `JWT_SECRET` | JWT signing secret | ❌ (has default) |

### Production (.env.production)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Full Neon connection string | ✅ |
| `JWT_SECRET` | JWT signing secret (use strong value!) | ✅ |
| `LOG_LEVEL` | Logging level (default: info) | ❌ |

## How Neon Local Works

Neon Local is a proxy that creates a local interface to your Neon cloud database:

1. **Ephemeral Branches**: When the container starts, it creates a new database branch from your main branch
2. **Local Connection**: Your app connects to `localhost:5432` instead of the cloud URL
3. **Auto-cleanup**: When the container stops, the ephemeral branch is deleted (configurable)
4. **Git Integration**: Can persist branches per Git branch using volume mounts

### Preserving Branches per Git Branch

The `docker-compose.dev.yml` includes volume mounts that persist branch metadata per Git branch:

```yaml
volumes:
  - ./.neon_local/:/tmp/.neon_local
  - ./.git/HEAD:/tmp/.git/HEAD:ro,consistent
```

This means switching Git branches will use different database branches automatically.

### Keeping Branches After Container Stops

To keep branches for debugging:

```bash
DELETE_BRANCH=false docker compose -f docker-compose.dev.yml up
```

## Database Migrations

### Development

```bash
# Generate migrations from schema changes
docker compose -f docker-compose.dev.yml exec app npm run db:generate

# Apply migrations
docker compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio (requires port forwarding)
npm run db:studio
```

### Production

Run migrations before deploying:

```bash
# With production DATABASE_URL set
npm run db:migrate
```

## Common Commands

```bash
# Build without starting
docker compose -f docker-compose.dev.yml build

# Start in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f app
docker compose -f docker-compose.dev.yml logs -f db

# Restart app only
docker compose -f docker-compose.dev.yml restart app

# Shell into container
docker compose -f docker-compose.dev.yml exec app sh

# Remove containers and volumes
docker compose -f docker-compose.dev.yml down -v

# Rebuild from scratch
docker compose -f docker-compose.dev.yml up --build --force-recreate
```

## Troubleshooting

### "Cannot connect to database"

1. Check that Neon Local container is healthy:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```

2. Verify your Neon API key and project ID are correct

3. Check Neon Local logs:
   ```bash
   docker compose -f docker-compose.dev.yml logs db
   ```

### "Database branch not found"

The ephemeral branch may have been deleted. Restart the containers:
```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up
```

### Mac Docker Desktop: gRPC FUSE Issue

If using Docker Desktop for Mac, ensure VM settings use gRPC FUSE instead of VirtioFS:
- Docker Desktop → Settings → General → Virtual Machine Options

### Port 5432 Already in Use

Stop any local PostgreSQL instances:
```bash
# macOS with Homebrew
brew services stop postgresql

# Or change the port mapping in docker-compose.dev.yml
ports:
  - '5433:5432'  # Use 5433 instead
```

## File Structure

```
acquisitions/
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.dev.yml  # Development with Neon Local
├── docker-compose.prod.yml # Production with Neon Cloud
├── .env.development        # Dev environment template
├── .env.production         # Prod environment template
├── .neon_local/            # Neon Local metadata (gitignored)
└── src/
    └── config/
        └── database.js     # Environment-aware DB config
```

## Security Notes

- Never commit `.env` files with real credentials
- Use strong, unique `JWT_SECRET` in production
- The production Dockerfile runs as non-root user
- Environment variables are injected at runtime, not baked into images
