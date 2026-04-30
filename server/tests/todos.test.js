const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');

let mongod;
let app;

beforeAll(async () => {
    // 30s launchTimeout to tolerate cold-start latency on first mongod
    // boot inside a fresh IDE container (default is 10s and can flake on
    // first download/spawn). The option key is `launchTimeout`, not
    // `startTimeout` — see mongodb-memory-server v9 source.
    mongod = await MongoMemoryServer.create({ instance: { launchTimeout: 30000 } });
    await mongoose.connect(mongod.getUri());
    app = createApp();
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
});

beforeEach(async () => {
    await mongoose.connection.dropDatabase();
});

describe('Todos API (visible tests)', () => {
    test('GET /api/todos returns an empty list initially', async () => {
        const res = await request(app).get('/api/todos');
        expect(res.status).toBe(200);
        expect(res.body.todos).toEqual([]);
    });

    test('POST /api/todos creates a todo when given a valid title', async () => {
        const res = await request(app)
            .post('/api/todos')
            .send({ title: 'Walk the dog' });
        expect(res.status).toBe(201);
        expect(res.body.todo).toMatchObject({
            title: 'Walk the dog',
            completed: false,
        });
        expect(res.body.todo.id).toBeDefined();
    });

    test('GET /api/todos returns the created todo', async () => {
        await request(app).post('/api/todos').send({ title: 'Buy milk' });
        const res = await request(app).get('/api/todos');
        expect(res.status).toBe(200);
        expect(res.body.todos).toHaveLength(1);
        expect(res.body.todos[0].title).toBe('Buy milk');
    });

    test('GET /api/todos/:id returns 404 when the id does not exist', async () => {
        const res = await request(app).get('/api/todos/507f1f77bcf86cd799439011');
        expect(res.status).toBe(404);
    });
});
