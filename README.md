# Trivikrama Auth Slice

Production-grade authentication and authorization system for Defense Command with:
- **Fail-fast config validation** at startup using JSON schemas
- **PBKDF2-SHA256 password hashing** (no plaintext passwords)
- **JWT-based authentication** with role-based access control (RBAC)
- **Clearance-level filtering** for entity visibility
- **Immutable SecurityContext** propagated through middleware

## Project Structure

```
trivikrama-auth-slice/
  package.json
  env.template
  README.md
  LICENSE

  config/
    auth/
      users.json          # User credentials (hashed passwords)
      roles.json          # Role definitions with permissions

  schemas/
    auth/
      users.schema.json           # Validation schema for users
      roles.schema.json           # Validation schema for roles
      login_request.schema.json   # Validation schema for login requests

  src/
    server.js              # Main server bootstrap

    domain/
      entities.js          # Entity definitions

    security/
      configLoader.js      # Config loading with schema validation
      passwordHash.js      # PBKDF2 password verification
      securityContext.js   # Security context builder
      policyService.js     # RBAC + clearance policy resolution
      authService.js       # Authentication service (login + JWT)
      jwtMiddleware.js     # JWT verification middleware

    routes/
      auth.js              # Authentication routes
      entities.js          # Protected entity routes

  scripts/
    generate-password-hash.js  # Utility to generate password hashes
```

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.template .env
   # Edit .env and set TRIVI_JWT_SECRET to a long random string
   # You can generate a secure secret with: openssl rand -hex 32
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

The server will validate all config files against their schemas at startup. If validation fails, the server will not start.

## Usage

### Login

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "hq_admin",
    "password": "password123",
    "device_id": "dev-1"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 900,
  "security_context": {
    "user_id": "u_hq_admin_001",
    "roles": ["admin"],
    "clearance_level": 5,
    "allowed_entity_types": ["drone", "infantry", "radar", "vehicle", "artillery"],
    "unit": "HQ"
  }
}
```

### Access Protected Endpoint

```bash
TOKEN="<access_token_from_login>"
curl http://localhost:8080/entities \
  -H "Authorization: Bearer $TOKEN"
```

Response (filtered by role and clearance):
```json
{
  "viewer": {
    "user_id": "u_hq_admin_001",
    "roles": ["admin"],
    "clearance": 5
  },
  "entities": [
    { "id": "e1", "type": "infantry", "label": "Infantry Squad A", "min_clearance": 1 },
    { "id": "e2", "type": "drone", "label": "Drone Alpha", "min_clearance": 1 },
    { "id": "e3", "type": "radar", "label": "Radar North", "min_clearance": 4 },
    { "id": "e5", "type": "vehicle", "label": "Vehicle Convoy", "min_clearance": 2 }
  ]
}
```

## Default Users

- **hq_admin** (password: `password123`)
  - Role: `admin`
  - Clearance: 5
  - Can see: all entity types (drone, infantry, radar, vehicle, artillery)
  
- **field_op** (password: `password123`)
  - Role: `operator`
  - Clearance: 2
  - Can see: drone, infantry (limited by role)
  - Effective clearance capped at 3 (role limit)

## Generating Password Hashes

To create a new user or update a password:

```bash
node scripts/generate-password-hash.js "your-password-here"
```

Copy the output hash into `config/auth/users.json`.

## Security Features

1. **Password Hashing**: PBKDF2-SHA256 with 210,000 iterations
2. **JWT Tokens**: HS256 algorithm with configurable issuer/audience
3. **Schema Validation**: All configs validated at startup (fail-fast)
4. **RBAC**: Role-based access control with entity type filtering
5. **Clearance Levels**: Multi-level clearance system (0-10)
6. **Immutable Context**: SecurityContext is frozen to prevent tampering

## API Endpoints

- `GET /health` - Health check
- `POST /auth/login` - Authenticate and receive JWT
- `GET /entities` - Get filtered entities (requires JWT)

## Environment Variables

- `TRIVI_JWT_ISSUER` - JWT issuer (default: "trivikrama")
- `TRIVI_JWT_AUDIENCE` - JWT audience (default: "trivikrama-clients")
- `TRIVI_JWT_SECRET` - JWT signing secret (**REQUIRED** - set in .env)
- `TRIVI_PORT` - Server port (default: 8080)

## Architecture Notes

This implementation is designed as a **clean backend slice** that can be ported to C++/Rust. The file structure and separation of concerns follow production-grade patterns:

- **Configs are files** - Easy to version control and audit
- **Schemas are files** - Validation rules are explicit and versioned
- **Fail-fast validation** - Server won't start with invalid config
- **SecurityContext propagation** - Immutable context flows through middleware
- **Policy service** - Centralized RBAC + clearance logic

The SecurityContext established here is the **non-negotiable invariant** for all future data ingestion pipelines.

## Contributing

This is a production-grade authentication slice designed for the Trivikrama Defense Command system. The architecture is intentionally clean and portable to enable future migration to C++/Rust.

## License

MIT License - see [LICENSE](LICENSE) file for details.

