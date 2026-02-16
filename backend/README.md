# 🚀 Job Portal Backend – Secure Authentication System

A production-oriented authentication system built using **Node.js, Express, TypeScript, and PostgreSQL**.

This backend focuses on secure session management, refresh token rotation, email verification enforcement, and password reset flows following real-world authentication architecture principles.

---

## 📌 Core Features

- User Registration
- Mandatory Email Verification before Login
- Secure Login System
- Access & Refresh Token Authentication
- Refresh Token Rotation
- Session Reuse Detection (Replay Attack Protection)
- Forgot Password Flow
- Secure Password Reset
- Session-Based Authentication
- Automatic Expired Token Cleanup (Cron Job)
- Centralized Error Handling
- Request Validation using Zod
- Rate Limiting Middleware

---

## 🏗 Architecture

The project follows a clean layered architecture:

Controller → Service → Repository → Database

Each layer has a clear responsibility:

- **Controllers** → Handle HTTP requests and responses
- **Services** → Business logic
- **Repositories** → Database operations
- **Middleware** → Validation, rate limiting, error handling
- **Jobs** → Scheduled cleanup tasks

---

## 📂 Project Structure

```
backend/
 └── src/
      ├── config/
      ├── jobs/
      ├── modules/
      │     ├── auth/
      │     ├── email/
      │     └── session/
      ├── routes/
      ├── shared/
      │     ├── errors/
      │     ├── middleware/
      │     └── helpers/
      ├── types/
      ├── app.ts
      └── index.ts
```

---

## 🔐 Authentication Flow

### 1️⃣ Registration

- User registers
- Password hashed using bcrypt
- Email verification token generated
- Verification email sent
- User cannot login until verified

---

### 2️⃣ Email Verification

- Secure random token generated
- Token stored hashed in database
- Expiration enforced
- On verification:
  - User marked as verified
  - Token invalidated

---

### 3️⃣ Login

- Validates email & password
- Ensures email is verified
- Creates a new session
- Generates:
  - Short-lived Access Token
  - Long-lived Refresh Token (7 days)

Refresh token:

- Stored as bcrypt hash in database
- Linked to `session_id`
- Sent via HTTP-only cookie

---

### 4️⃣ Refresh Token Rotation

On every refresh request:

1. Verify JWT signature
2. Find session by `sessionId`
3. Compare refresh token using bcrypt
4. Generate new access & refresh tokens
5. Update session with new hashed refresh token

Old refresh token becomes invalid immediately.

---

### 5️⃣ Session Reuse Detection

If:

- Session not found
- OR bcrypt comparison fails

All sessions for that user are deleted.

User must login again.

This prevents replay attacks using stolen refresh tokens.

---

### 6️⃣ Forgot Password

- Secure reset token generated
- Token stored hashed in DB
- Expiration enforced
- On reset:
  - Password updated
  - Reset token invalidated

---

## 🧠 Session Management

Each login creates a unique session.

Session table contains:

- session_id
- user_id
- token_hash
- expires_at
- created_at

Supports:

- Multi-device login
- Secure token rotation
- Manual logout
- Automatic expiration

---

## 🧹 Scheduled Cleanup

Using node-cron:

- Deletes expired sessions
- Deletes expired email verification tokens
- Deletes expired password reset tokens

Maintains database hygiene.

---

## 🛡 Security Highlights

- Passwords hashed with bcrypt
- Refresh tokens hashed in database
- HTTP-only cookies
- Refresh token rotation
- Reuse detection
- Email verification enforced before login
- Expiration validation for all tokens
- Centralized error handling
- Request validation via Zod
- Rate limiting middleware

---

## 🧰 Tech Stack

- Node.js
- Express
- TypeScript
- PostgreSQL
- JWT
- bcrypt
- Zod
- node-cron

---

## 🚀 Future Improvements

- Swagger / OpenAPI documentation
- Unit & integration testing
- Structured logging system
- Session dashboard (active device management)
- Advanced RBAC implementation

---

## 🎯 Project Goal

This project demonstrates production-level authentication architecture including:

- Secure refresh token management
- Replay attack prevention
- Email verification enforcement
- Password reset security
- Clean modular backend structure

Designed with scalability and security in mind.

---
