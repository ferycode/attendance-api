# Attendance API

A RESTful API service for managing employee attendance using Node.js, MySQL, Redis, and Elasticsearch.

## Requirements

- Node.js (v18 or higher)
- MySQL
- Elasticsearch (v7.x)
- Redis
- Docker (optional)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create `.env` file in root directory
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=attendance_db
DB_PORT=3306

# Elasticsearch
ES_NODES=http://localhost:9200
ES_MAX_RETRY=10
ES_TIMEOUT_SECS=60000
ES_NUM_SHARDS=1
ES_NUM_REPLICAS=0

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=ee1bad8ffd25df6ae2f8bcad22c32c8db4f20278348bb6f9eebeef0a569e2ba96732c9e87ab2c3410954f1ca9168d8c2b715877dfefedc21a0a73fae99bff082
JWT_EXPIRE=1d

# Google OAuth
GOOGLE_CLIENT_ID=41226856399-eofnqf3bv4alt4cod5tl4hi9s3fldn28.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3000/v1/oauth/callback

# Gmail
GMAIL_USER='your@gmail.com'
GMAIL_PASS='yourpassword'
```

4. Setup database configuration in `config/database.json`
```json
{
  "development": {
    "username": "atd",
    "password": "atd",
    "database": "attendance_db",
    "host": "mysql", // set to localhost if not using docker
    "port": 3306,
    "dialect": "mysql"
  },
}
```

5. Run database migrations:
```bash
# Using Docker
npm run db:migrate

# Without Docker
npm run raw:db:migrate
```

6. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Using Docker
- Setup with docker compose
```
docker compose up -d
```

## API Documentation

### Users

#### Register User
```
POST /v1/users
```
Body:
- `email`: your email address (required)
- `password`: your password (required)
- `name`: your name (optional)
- `phone`: your phone (optional)
- `address`: your address (optional)
- `department`: your department (optional, valid: IT, HR, FINANCE, MARKETING, SALES, OTHER)
```json
{
    "email": "user@example.com",
    "password": "123456",
    "name": "Fery Dedi Supardi",
    "phone": "+6285733100499",
    "address": "Malang",
    "department": "IT",
}
```

#### User Profile
```
GET /v1/users/profile
```
Header:
```
Authorization: Bearer {token}
```

#### Update Profile
```
PUT /v1/users/update
```
Body:
- `email`: your email address (required)
- `password`: your password (required)
- `name`: your name (optional)
- `phone`: your phone (optional)
- `address`: your address (optional)
- `department`: your department (optional, valid: IT, HR, FINANCE, MARKETING, SALES, OTHER)
```json
{
    "name": "Fery Dedi Supardi",
    "phone": "+6285733100499",
    "address": "Malang",
    "department": "IT",
}
```

#### Update User Password
```
POST /v1/users/set-password
```
Body:
- `password`: your password (required)
```json
{
    "password": "123456"
}
```
Header:
```
Authorization: Bearer {token}
```

### Authentication

#### Login
```
POST /v1/users/login
```
Body:
- `email`: your email address (required)
- `password`: your password (required)
```json
{
    "email": "user@example.com",
    "password": "123456"
}
```

#### Google OAuth Login
```
GET /v1/oauth
```

#### Logout
```
POST /v1/users/logout
```
Header:
```
Authorization: Bearer {token}
```

### Clock In/Out

#### Clock In
```
POST /v1/clocks
```
Header:
```
Authorization: Bearer {token}
```
Body:
- `type`: clock-in / clock-out (required)
- `notes`: your notes (optional)
```json
{
    "type": "clock-in",
    "notes": "some notes"
}
```

#### Clock Out
```
POST /v1/clocks
```
Header:
```
Authorization: Bearer {token}
```
Body:
- `type`: clock-in / clock-out (required)
- `notes`: your notes (optional)
```json
{
    "type": "clock-out",
    "notes": "some notes"
}
```

### Trigger Reminder Email
```
POST /v1/clocks/reminder
```
Body:
- `date`: clock-in date reminder (optional, default today)

```json
{
    "date": "2025-02-25"
}
```

### Reports

#### Get Users Report
```
GET /v1/reports/users
```
Query Parameters:
- `name`: user name (optional)
- `email`: user email (optional)
- `address`: user address (optional)
- `department`: user department (optional)
- `page`: page (optional, default 1)
- `perPage`: perPage (optional, default 50)

Sample:
- http://localhost:3000/v1/reports/users?phone=6285733100499&department=IT

#### Get Attendances Report
```
GET /v1/reports/attendances
```
Query Parameters:
- `periodStart`: YYYY-MM-DD (optional)
- `periodEnd`: YYYY-MM-DD (optional)
- `type`:  clock-in / clock-out (optional)
- `name`: user name (optional)
- `email`: user email (optional)
- `department`: user department (optional)
- `page`: page (optional, default 1)
- `perPage`: perPage (optional, default 50)

Sample:
- http://localhost:3000/v1/reports?periodStart=2025-02-25&periodEnd=2025-02-29&phone=+6285733100499&department=IT