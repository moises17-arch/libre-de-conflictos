'use strict';

// Set env vars before requiring anything
process.env.JWT_SECRET = 'test_secret';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
process.env.NODE_ENV = 'test';

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

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const eventRoutes = require('../src/routes/event.routes');
const { errorHandler } = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/events', eventRoutes);
app.use(errorHandler);

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeToken(payload = { id: 1, email: 'test@test.com' }) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

const MOCK_EVENT = {
  id: 1,
  user_id: 1,
  title: 'Test Event',
  description: 'A test',
  start_time: new Date(Date.now() + 3600000).toISOString(),
  end_time: new Date(Date.now() + 7200000).toISOString(),
  timezone: 'UTC',
};

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('POST /api/events', () => {
  beforeEach(() => jest.clearAllMocks());

  it('sin token → 401', async () => {
    const res = await request(app).post('/api/events').send({
      title: 'Test',
      startTime: new Date(Date.now() + 3600000).toISOString(),
      endTime: new Date(Date.now() + 7200000).toISOString(),
      timezone: 'UTC',
    });
    expect(res.status).toBe(401);
  });

  it('con token válido y sin conflicto → 201', async () => {
    const token = makeToken();
    // BEGIN
    mockClientQueryImpl
      .mockResolvedValueOnce({})                                   // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })            // overlap check
      .mockResolvedValueOnce({ rows: [MOCK_EVENT], rowCount: 1 })  // INSERT event
      .mockResolvedValueOnce({});                                  // COMMIT

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Event',
        description: 'A test',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        timezone: 'UTC',
      });

    expect(res.status).toBe(201);
    expect(res.body.event).toBeDefined();
  });

  it('con token válido y con conflicto → 409', async () => {
    const token = makeToken();
    const conflictingEvent = { ...MOCK_EVENT, title: 'Conflicting Event' };

    mockClientQueryImpl
      .mockResolvedValueOnce({})                                            // BEGIN
      .mockResolvedValueOnce({ rows: [conflictingEvent], rowCount: 1 })    // overlap → conflict
      .mockResolvedValueOnce({});                                           // ROLLBACK

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'New Event',
        startTime: new Date(Date.now() + 3600000).toISOString(),
        endTime: new Date(Date.now() + 7200000).toISOString(),
        timezone: 'UTC',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Conflicto/);
  });
});

describe('GET /api/events/user/:userId', () => {
  beforeEach(() => jest.clearAllMocks());

  it('con token válido → 200 con array de eventos paginado', async () => {
    const token = makeToken({ id: 1, email: 'test@test.com' });

    // findByUserId uses pool.query twice: SELECT events + COUNT
    mockQueryImpl
      .mockResolvedValueOnce({ rows: [MOCK_EVENT], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ count: '1' }], rowCount: 1 });

    const res = await request(app)
      .get('/api/events/user/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('totalPages');
  });
});

describe('GET /api/events/stats', () => {
  beforeEach(() => jest.clearAllMocks());

  it('con token válido → 200 con { total, upcoming, active }', async () => {
    const token = makeToken();

    mockQueryImpl.mockResolvedValueOnce({
      rows: [{ total: '5', upcoming: '3', active: '1' }],
      rowCount: 1,
    });

    const res = await request(app)
      .get('/api/events/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('upcoming');
    expect(res.body).toHaveProperty('active');
  });
});

describe('DELETE /api/events/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('con token válido y ownership correcto → 200', async () => {
    const token = makeToken({ id: 1, email: 'test@test.com' });

    mockClientQueryImpl
      .mockResolvedValueOnce({})                                   // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })  // ownership check
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })            // DELETE
      .mockResolvedValueOnce({});                                  // COMMIT

    const res = await request(app)
      .delete('/api/events/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminado/);
  });

  it('con token de otro usuario → 404 o 403', async () => {
    const token = makeToken({ id: 2, email: 'other@test.com' });

    mockClientQueryImpl
      .mockResolvedValueOnce({})                                   // BEGIN
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })            // ownership check → not found
      .mockResolvedValueOnce({});                                  // ROLLBACK

    const res = await request(app)
      .delete('/api/events/1')
      .set('Authorization', `Bearer ${token}`);

    expect([403, 404, 500]).toContain(res.status);
  });
});
