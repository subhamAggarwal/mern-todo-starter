const express = require('express');
const Todo = require('../models/Todo');

const router = express.Router();

// Helper: validate ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Helper: build query from filters
const buildQuery = (query) => {
    // TODO: implement filtering, sorting, and pagination
    const { limit = 100, offset = 0 } = query;
    return { mongoQuery: {}, sortOption: { createdAt: 1 }, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
};

// GET /api/todos
router.get('/', async (req, res, next) => {
    try {
        const { mongoQuery, sortOption, limit, offset } = buildQuery(req.query);
        const todos = await Todo.find(mongoQuery)
            .sort(sortOption)
            .limit(limit)
            .skip(offset);
        res.json({ todos });
    } catch (err) {
        next(err);
    }
});

// POST /api/todos
router.post('/', async (req, res, next) => {
    try {
        const { title, description, priority, dueDate, tags, position } = req.body || {};

        // Validation
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'Title is required and must be a non-empty string' });
        }
        // TODO: add validation for max length, priority, dueDate, tags, position

        const todo = await Todo.create({
            title: title.trim(),
            description: description?.trim() || undefined,
            priority: priority || 'medium',
            dueDate: dueDate ? new Date(dueDate) : undefined,
            tags: tags || [],
            position: position !== undefined ? position : 0,
        });
        res.status(201).json({ todo });
    } catch (err) {
        // Handle Mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(422).json({ error: err.message });
        }
        next(err);
    }
});

// GET /api/todos/:id
router.get('/:id', async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json({ error: 'Todo not found' });
        res.json({ todo });
    } catch (err) {
        res.status(404).json({ error: 'Todo not found' });
    }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
    // TODO: implement update with validation
    res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
    // TODO: implement toggle
    res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
    // TODO: implement delete
    res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/todos?status=completed
router.delete('/', async (req, res, next) => {
    // TODO: implement bulk delete
    res.status(501).json({ error: 'Not implemented' });
});

// POST /api/todos/reorder
router.post('/reorder', async (req, res, next) => {
    // TODO: implement reorder
    res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
