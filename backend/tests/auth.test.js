'use strict';

// Set env vars before requiring anything
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── Mock pool BEFORE requiring the app ───────────────────────────────────────
let mockQueryImpl = jest.fn();
let mockClientQueryImpl = jest.fn();

jest.mock('../src/config/db', () => {
  const mockClient = {
    query: (...args) => mockClientQueryImpl(...args),
    release: jest.fn(),
  };
  return {
    query: (...args) => mockQueryImpl(...args),
    connect: jest.fn().mockResolvedValue(mockClient),
  };
});

// Now require the app
const request = require('supertest');

// We need a minimal express app that only mounts auth routes,
// bypassing the env-var guard and DB migration in src/index.js
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('../src/routes/auth.routes');
const { errorHandler } = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const HASHED_PASSWORD = bcrypt.hashSync('password123', 10);
const MOCK_USER = {
  id: 1,
  name: 'Test User',
  email: 'test@test.com',
  password: HASHED_PASSWORD,
  created_at: new Date().toISOString(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registro exitoso devuelve 201 con accessToken y user', async () => {
    // findByEmail → no user found
    mockQueryImpl
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })   // findByEmail
      .mockResolvedValueOnce({                            // INSERT users
        rows: [{ id: 1, name: 'Test User', email: 'test@test.com', created_at: new Date() }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });  // INSERT refresh_tokens

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
  });

  it('email duplicado devuelve 409', async () => {
    // findByEmail → user exists
    mockQueryImpl.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('email malformado devuelve 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email: 'not-an-email', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('login exitoso devuelve 200 con accessToken', async () => {
    // findByEmail → user exists with hashed password
    mockQueryImpl
      .mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 })  // findByEmail
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });           // INSERT refresh_tokens

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });

  it('credenciales incorrectas devuelve 401', async () => {
    // findByEmail → user exists but password won't match
    mockQueryImpl.mockResolvedValueOnce({ rows: [MOCK_USER], rowCount: 1 });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'wrong_password' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('devuelve 200', async () => {
    mockQueryImpl.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
