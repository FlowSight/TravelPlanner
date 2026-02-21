const request = require('supertest');
const app = require('../../src/server');
const { setup, clearDB, teardown, createTestUser } = require('../helpers');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  await setup();
});
afterEach(async () => await clearDB());
afterAll(async () => await teardown());

describe('GET /api/users/search', () => {
  it('should search users by name', async () => {
    const { token } = await createTestUser({ email: 'searcher@test.com', name: 'Searcher' });
    await createTestUser({ email: 'alice@test.com', name: 'Alice Smith' });
    await createTestUser({ email: 'bob@test.com', name: 'Bob Jones' });

    const res = await request(app)
      .get('/api/users/search?q=alice')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].name).toBe('Alice Smith');
  });

  it('should search users by email', async () => {
    const { token } = await createTestUser({ email: 'searcher@test.com', name: 'Searcher' });
    await createTestUser({ email: 'alice@test.com', name: 'Alice' });

    const res = await request(app)
      .get('/api/users/search?q=alice@')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].email).toBe('alice@test.com');
  });

  it('should return empty array for no matches', async () => {
    const { token } = await createTestUser({ email: 'searcher@test.com' });

    const res = await request(app)
      .get('/api/users/search?q=nonexistent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(0);
  });

  it('should reject query shorter than 2 characters', async () => {
    const { token } = await createTestUser({ email: 'searcher@test.com' });

    const res = await request(app)
      .get('/api/users/search?q=a')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least 2 characters/);
  });

  it('should reject search without auth', async () => {
    const res = await request(app).get('/api/users/search?q=test');

    expect(res.status).toBe(401);
  });

  it('should not return password fields', async () => {
    const { token } = await createTestUser({ email: 'searcher@test.com', name: 'Searcher' });
    await createTestUser({ email: 'alice@test.com', name: 'Alice' });

    const res = await request(app)
      .get('/api/users/search?q=alice')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users[0]).not.toHaveProperty('password');
  });
});

describe('GET /api/users', () => {
  it('should list all users for admin', async () => {
    const { token } = await createTestUser({ email: 'admin@test.com', role: 'admin' });
    await createTestUser({ email: 'user1@test.com' });
    await createTestUser({ email: 'user2@test.com' });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(3);
  });

  it('should reject non-admin user', async () => {
    const { token } = await createTestUser({ email: 'regular@test.com', role: 'user' });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/users');

    expect(res.status).toBe(401);
  });
});
