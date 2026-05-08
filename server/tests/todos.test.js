const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { createApp } = require('../src/app');
const Todo = require('../src/models/Todo');

let mongod;
let app;

beforeAll(async () => {
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

describe('Todos API (visible) – Basics', () => {
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

    test('POST returns 400 when title is missing', async () => {
        const res = await request(app).post('/api/todos').send({});
        expect(res.status).toBe(400);
    });
});

describe('Todos API (visible) – Update & Toggle', () => {
    test('PUT /api/todos/:id updates a todo title', async () => {
        const created = await request(app).post('/api/todos').send({ title: 'Old title' });
        const id = created.body.todo.id;
        const res = await request(app).put(`/api/todos/${id}`).send({ title: 'New title' });
        expect(res.status).toBe(200);
        expect(res.body.todo.title).toBe('New title');
    });

    test('PATCH /api/todos/:id/toggle flips completed status', async () => {
        const created = await request(app).post('/api/todos').send({ title: 'Toggle me' });
        const id = created.body.todo.id;
        const res = await request(app).patch(`/api/todos/${id}/toggle`);
        expect(res.status).toBe(200);
        expect(res.body.todo.completed).toBe(true);
    });
});

describe('Todos API (visible) – Delete', () => {
    test('DELETE /api/todos/:id removes a todo', async () => {
        const created = await request(app).post('/api/todos').send({ title: 'Delete me' });
        const id = created.body.todo.id;
        const res = await request(app).delete(`/api/todos/${id}`);
        expect([200, 204]).toContain(res.status);
        const after = await request(app).get('/api/todos');
        expect(after.body.todos).toHaveLength(0);
    });

    test('DELETE /api/todos?status=completed clears completed todos', async () => {
        await Todo.create({ title: 'Active', completed: false });
        await Todo.create({ title: 'Completed', completed: true });
        const res = await request(app).delete('/api/todos?status=completed');
        expect(res.status).toBe(200);
        expect(res.body.deletedCount).toBe(1);
    });
});

describe('Todos API (visible) – Filtering & Reorder', () => {
    test('GET ?status=active returns only incomplete todos', async () => {
        await Todo.create({ title: 'A1', completed: false });
        await Todo.create({ title: 'C1', completed: true });
        const res = await request(app).get('/api/todos?status=active');
        expect(res.status).toBe(200);
        expect(res.body.todos).toHaveLength(1);
        expect(res.body.todos[0].completed).toBe(false);
    });

    test('POST /api/todos/reorder updates positions', async () => {
        const t1 = await request(app).post('/api/todos').send({ title: 'First', position: 0 });
        const t2 = await request(app).post('/api/todos').send({ title: 'Second', position: 1 });
        const res = await request(app).post('/api/todos/reorder').send({
            items: [
                { id: t2.body.todo.id, position: 0 },
                { id: t1.body.todo.id, position: 1 },
            ],
        });
        expect(res.status).toBe(200);
        expect(res.body.todos).toHaveLength(2);
    });
});
