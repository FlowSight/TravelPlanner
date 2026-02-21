const request = require('supertest');
const app = require('../../src/server');
const { setup, clearDB, teardown, createTestUser, createTestPlace } = require('../helpers');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  await setup();
});
afterEach(async () => await clearDB());
afterAll(async () => await teardown());

describe('GET /api/places', () => {
  it('should return all places (public, no auth needed)', async () => {
    await createTestPlace({ name: 'Wat Pho', city: 'Bangkok' });
    await createTestPlace({ name: 'Pattaya Beach', city: 'Pattaya' });

    const res = await request(app).get('/api/places');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.places).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('should filter by country', async () => {
    await createTestPlace({ name: 'Temple', country: 'Thailand' });
    await createTestPlace({ name: 'Eiffel Tower', country: 'France' });

    const res = await request(app).get('/api/places?country=Thailand');

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0].name).toBe('Temple');
  });

  it('should filter by city', async () => {
    await createTestPlace({ name: 'A', city: 'Bangkok' });
    await createTestPlace({ name: 'B', city: 'Pattaya' });

    const res = await request(app).get('/api/places?city=Bangkok');

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0].city).toBe('Bangkok');
  });

  it('should filter by type', async () => {
    await createTestPlace({ name: 'Temple', type: 'history' });
    await createTestPlace({ name: 'Market', type: 'shopping' });

    const res = await request(app).get('/api/places?type=history');

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0].type).toBe('history');
  });

  it('should search by name', async () => {
    await createTestPlace({ name: 'Wat Arun' });
    await createTestPlace({ name: 'ICONSIAM' });

    const res = await request(app).get('/api/places?search=Arun');

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(1);
    expect(res.body.places[0].name).toBe('Wat Arun');
  });

  it('should return empty array when no places exist', async () => {
    const res = await request(app).get('/api/places');

    expect(res.status).toBe(200);
    expect(res.body.places).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});

describe('GET /api/places/:id', () => {
  it('should return a single place by id', async () => {
    const place = await createTestPlace({ name: 'Grand Palace' });

    const res = await request(app).get(`/api/places/${place._id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.place.name).toBe('Grand Palace');
  });

  it('should return 404 for non-existent place', async () => {
    const fakeId = '000000000000000000000000';
    const res = await request(app).get(`/api/places/${fakeId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/places (admin only)', () => {
  it('should create a place as admin', async () => {
    const { token } = await createTestUser({ email: 'admin@test.com', role: 'admin' });

    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Temple', country: 'Thailand', city: 'Bangkok', type: 'history' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.place.name).toBe('New Temple');
  });

  it('should reject creation by non-admin user', async () => {
    const { token } = await createTestUser({ email: 'user@test.com', role: 'user' });

    const res = await request(app)
      .post('/api/places')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Blocked', country: 'Thailand' });

    expect(res.status).toBe(403);
  });

  it('should reject creation without auth', async () => {
    const res = await request(app)
      .post('/api/places')
      .send({ name: 'No Auth', country: 'Thailand' });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/places/:id (admin only)', () => {
  it('should update a place as admin', async () => {
    const { token } = await createTestUser({ email: 'admin@test.com', role: 'admin' });
    const place = await createTestPlace({ name: 'Old Name' });

    const res = await request(app)
      .put(`/api/places/${place._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.place.name).toBe('New Name');
  });

  it('should return 404 for non-existent place', async () => {
    const { token } = await createTestUser({ email: 'admin@test.com', role: 'admin' });
    const fakeId = '000000000000000000000000';

    const res = await request(app)
      .put(`/api/places/${fakeId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nothing' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/places/:id (admin only)', () => {
  it('should delete a place as admin', async () => {
    const { token } = await createTestUser({ email: 'admin@test.com', role: 'admin' });
    const place = await createTestPlace({ name: 'To Delete' });

    const res = await request(app)
      .delete(`/api/places/${place._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const check = await request(app).get(`/api/places/${place._id}`);
    expect(check.status).toBe(404);
  });

  it('should return 404 when deleting non-existent place', async () => {
    const { token } = await createTestUser({ email: 'admin@test.com', role: 'admin' });
    const fakeId = '000000000000000000000000';

    const res = await request(app)
      .delete(`/api/places/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
