const request = require('supertest');
const { ObjectId } = require('mongodb');
const app = require('../../src/server');
const { setup, clearDB, teardown, createTestUser, createTestPlace, getDb } = require('../helpers');

beforeAll(async () => {
  process.env.JWT_SECRET = 'test_jwt_secret';
  await setup();
});
afterEach(async () => await clearDB());
afterAll(async () => await teardown());

describe('POST /api/trips', () => {
  it('should create a trip', async () => {
    const { token } = await createTestUser({ email: 'owner@test.com' });

    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Thailand 2026', destination: 'Bangkok', status: 'planning' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.trip.title).toBe('Thailand 2026');
    expect(res.body.trip.status).toBe('planning');
  });

  it('should reject creating trip without auth', async () => {
    const res = await request(app)
      .post('/api/trips')
      .send({ title: 'No Auth Trip' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/trips', () => {
  it('should list trips owned by current user', async () => {
    const { user, token } = await createTestUser({ email: 'owner@test.com' });

    await getDb().collection('trips').insertOne({
      title: 'My Trip',
      owner: user._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].title).toBe('My Trip');
  });

  it('should list trips where user is a member', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { user: member, token: memberToken } = await createTestUser({ email: 'member@test.com' });

    await getDb().collection('trips').insertOne({
      title: 'Shared Trip',
      owner: owner._id,
      members: [{ user: member._id, role: 'editor' }],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(1);
    expect(res.body.trips[0].title).toBe('Shared Trip');
  });

  it('should not list trips user has no access to', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { token: strangerToken } = await createTestUser({ email: 'stranger@test.com' });

    await getDb().collection('trips').insertOne({
      title: 'Private Trip',
      owner: owner._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get('/api/trips')
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.trips).toHaveLength(0);
  });
});

describe('GET /api/trips/:id', () => {
  it('should return trip details for a member', async () => {
    const { user, token } = await createTestUser({ email: 'owner@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Detail Trip',
      owner: user._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.trip.title).toBe('Detail Trip');
  });

  it('should deny access to non-member', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { token: strangerToken } = await createTestUser({ email: 'stranger@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Secret Trip',
      owner: owner._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .get(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${strangerToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 404 for non-existent trip', async () => {
    const { token } = await createTestUser({ email: 'user@test.com' });
    const fakeId = '000000000000000000000000';

    const res = await request(app)
      .get(`/api/trips/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/trips/:id', () => {
  it('should update trip as owner', async () => {
    const { user, token } = await createTestUser({ email: 'owner@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Old Title',
      owner: user._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .put(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Title' });

    expect(res.status).toBe(200);
    expect(res.body.trip.title).toBe('New Title');
  });

  it('should update trip as editor member', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { user: editor, token: editorToken } = await createTestUser({ email: 'editor@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Shared Trip',
      owner: owner._id,
      members: [{ user: editor._id, role: 'editor' }],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .put(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ title: 'Editor Updated' });

    expect(res.status).toBe(200);
    expect(res.body.trip.title).toBe('Editor Updated');
  });

  it('should deny update to viewer member', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { user: viewer, token: viewerToken } = await createTestUser({ email: 'viewer@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'ViewOnly Trip',
      owner: owner._id,
      members: [{ user: viewer._id, role: 'viewer' }],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .put(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ title: 'Should Fail' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/trips/:id/members', () => {
  it('should add a member as owner', async () => {
    const { user: owner, token: ownerToken } = await createTestUser({ email: 'owner@test.com' });
    const { user: newMember } = await createTestUser({ email: 'new@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Team Trip',
      owner: owner._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post(`/api/trips/${result.insertedId}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ userId: newMember._id.toString(), role: 'editor' });

    expect(res.status).toBe(200);
    expect(res.body.trip.members).toHaveLength(1);
  });

  it('should reject adding member by non-owner', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { user: editor, token: editorToken } = await createTestUser({ email: 'editor@test.com' });
    const { user: newMember } = await createTestUser({ email: 'new@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Team Trip',
      owner: owner._id,
      members: [{ user: editor._id, role: 'editor' }],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post(`/api/trips/${result.insertedId}/members`)
      .set('Authorization', `Bearer ${editorToken}`)
      .send({ userId: newMember._id.toString() });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/trips/:id/members/:userId', () => {
  it('should remove a member as owner', async () => {
    const { user: owner, token: ownerToken } = await createTestUser({ email: 'owner@test.com' });
    const { user: member } = await createTestUser({ email: 'member@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Team Trip',
      owner: owner._id,
      members: [{ user: member._id, role: 'editor' }],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/trips/${result.insertedId}/members/${member._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Member removed');
  });
});

describe('DELETE /api/trips/:id', () => {
  it('should delete trip as owner', async () => {
    const { user, token } = await createTestUser({ email: 'owner@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Delete Me',
      owner: user._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Trip deleted');
  });

  it('should deny deletion by non-owner', async () => {
    const { user: owner } = await createTestUser({ email: 'owner@test.com' });
    const { token: memberToken } = await createTestUser({ email: 'member@test.com' });

    const result = await getDb().collection('trips').insertOne({
      title: 'Not Yours',
      owner: owner._id,
      members: [],
      itinerary: [],
      documents: [],
      status: 'planning',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .delete(`/api/trips/${result.insertedId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });
});
