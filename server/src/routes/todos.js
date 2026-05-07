const express = require('express');
const Todo = require('../models/Todo');

const router = express.Router();

// Helper: validate ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Helper: build query from filters
const buildQuery = (query) => {
    const { status, priority, q, sort, limit = 100, offset = 0 } = query;
    const mongoQuery = {};

    if (status === 'active') mongoQuery.completed = false;
    else if (status === 'completed') mongoQuery.completed = true;

    if (priority && ['low', 'medium', 'high'].includes(priority)) {
        mongoQuery.priority = priority;
    }

    if (q) {
        mongoQuery.$or = [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
        ];
    }

    let sortOption = { position: 1, createdAt: 1 };
    if (sort === 'createdAt') sortOption = { createdAt: 1 };
    else if (sort === 'priority') sortOption = { priority: 1, createdAt: 1 };
    else if (sort === 'dueDate') sortOption = { dueDate: 1, createdAt: 1 };

    return { mongoQuery, sortOption, limit: parseInt(limit, 10), offset: parseInt(offset, 10) };
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
        if (title.trim().length > 200) {
            return res.status(400).json({ error: 'Title must be at most 200 characters' });
        }
        if (description && description.length > 500) {
            return res.status(400).json({ error: 'Description must be at most 500 characters' });
        }
        if (priority && !['low', 'medium', 'high'].includes(priority)) {
            return res.status(400).json({ error: 'Priority must be one of: low, medium, high' });
        }
        if (dueDate && isNaN(Date.parse(dueDate))) {
            return res.status(400).json({ error: 'Invalid dueDate format' });
        }
        if (tags && (!Array.isArray(tags) || tags.length > 5)) {
            return res.status(400).json({ error: 'Tags must be an array with at most 5 entries' });
        }
        if (position !== undefined && (typeof position !== 'number' || position < 0)) {
            return res.status(400).json({ error: 'Position must be a non-negative number' });
        }

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
    if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    try {
        const { title, description, priority, dueDate, tags, position, completed } = req.body || {};
        const updateData = {};

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({ error: 'Title cannot be empty' });
            }
            if (title.trim().length > 200) {
                return res.status(400).json({ error: 'Title must be at most 200 characters' });
            }
            updateData.title = title.trim();
        }
        if (description !== undefined) {
            if (description.length > 500) {
                return res.status(400).json({ error: 'Description must be at most 500 characters' });
            }
            updateData.description = description.trim() || undefined;
        }
        if (priority !== undefined) {
            if (!['low', 'medium', 'high'].includes(priority)) {
                return res.status(400).json({ error: 'Priority must be one of: low, medium, high' });
            }
            updateData.priority = priority;
        }
        if (dueDate !== undefined) {
            if (dueDate && isNaN(Date.parse(dueDate))) {
                return res.status(400).json({ error: 'Invalid dueDate format' });
            }
            updateData.dueDate = dueDate ? new Date(dueDate) : undefined;
        }
        if (tags !== undefined) {
            if (!Array.isArray(tags) || tags.length > 5) {
                return res.status(400).json({ error: 'Tags must be an array with at most 5 entries' });
            }
            updateData.tags = tags;
        }
        if (position !== undefined) {
            if (typeof position !== 'number' || position < 0) {
                return res.status(400).json({ error: 'Position must be a non-negative number' });
            }
            updateData.position = position;
        }
        if (completed !== undefined) {
            if (typeof completed !== 'boolean') {
                return res.status(400).json({ error: 'Completed must be a boolean' });
            }
            updateData.completed = completed;
        }

        const todo = await Todo.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!todo) return res.status(404).json({ error: 'Todo not found' });
        res.json({ todo });
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(422).json({ error: err.message });
        }
        res.status(404).json({ error: 'Todo not found' });
    }
});

// PATCH /api/todos/:id/toggle
router.patch('/:id/toggle', async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json({ error: 'Todo not found' });
        todo.completed = !todo.completed;
        await todo.save();
        res.json({ todo });
    } catch (err) {
        res.status(404).json({ error: 'Todo not found' });
    }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
    if (!isValidObjectId(req.params.id)) {
        return res.status(404).json({ error: 'Todo not found' });
    }
    const t = await Todo.findByIdAndDelete(req.params.id);
    if (!t) return res.status(404).json({ error: 'Todo not found' });
    res.json({ todo: t });
});

// DELETE /api/todos?status=completed
router.delete('/', async (req, res, next) => {
    try {
        const { status } = req.query;
        if (status === 'completed') {
            const result = await Todo.deleteMany({ completed: true });
            res.json({ deletedCount: result.deletedCount });
        } else {
            return res.status(400).json({ error: 'Invalid status filter. Use ?status=completed' });
        }
    } catch (err) {
        next(err);
    }
});

// POST /api/todos/reorder
router.post('/reorder', async (req, res, next) => {
    try {
        const { items } = req.body || {};
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Items must be a non-empty array' });
        }

        // Validate each item
        for (const item of items) {
            if (!item.id || !isValidObjectId(item.id)) {
                return res.status(400).json({ error: 'Each item must have a valid id' });
            }
            if (typeof item.position !== 'number' || item.position < 0) {
                return res.status(400).json({ error: 'Each item must have a non-negative position' });
            }
        }

        // Bulk update positions
        const updates = items.map(({ id, position }) =>
            Todo.findByIdAndUpdate(id, { position }, { new: true })
        );
        const updatedTodos = await Promise.all(updates);

        // Filter out any null results (invalid IDs)
        const validTodos = updatedTodos.filter((t) => t !== null);

        if (validTodos.length !== items.length) {
            return res.status(404).json({ error: 'One or more todos not found' });
        }

        res.json({ todos: validTodos });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
