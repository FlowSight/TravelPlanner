const request = require('supertest');
const app = require('../../src/server');
const { setup, clearDB, teardown, createTestUser } = require('../helpers');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  await setup();
});
afterEach(async () => await clearDB());
afterAll(async () => await teardown());

describe('POST /api/auth/register', () => {
  it('should register a new user with email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.role).toBe('user');
  });

  it('should register a new user with phone', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Bob', phone: '+1234567890', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.phone).toBe('+1234567890');
  });

  it('should reject duplicate email', async () => {
    await createTestUser({ email: 'dup@test.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup', email: 'dup@test.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject missing name', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'noname@test.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Short', email: 'short@test.com', password: '12' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct email and password', async () => {
    await createTestUser({ email: 'login@test.com', password: 'mypassword' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'mypassword' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
  });

  it('should reject wrong password', async () => {
    await createTestUser({ email: 'wrong@test.com', password: 'correct' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'incorrect' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.com', password: 'anything' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject when no email or phone provided', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'something' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const { token } = await createTestUser({ email: 'me@test.com', name: 'Me' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Me');
    expect(res.body.user.email).toBe('me@test.com');
  });

  it('should reject request with no token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject request with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });
});
