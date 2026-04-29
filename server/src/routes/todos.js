const express = require('express');
const Todo = require('../models/Todo');

const router = express.Router();

// GET /api/todos
router.get('/', async (req, res, next) => {
    try {
        const todos = await Todo.find().sort({ createdAt: 1 });
        res.json({ todos });
    } catch (err) {
        next(err);
    }
});

// POST /api/todos
router.post('/', async (req, res, next) => {
    try {
        const { title, completed } = req.body || {};
        // TODO(candidate): validate the body. A request with no `title` should
        // return a clear 400, not a 500 from the unhandled ValidationError.
        const todo = await Todo.create({ title, completed });
        res.status(201).json({ todo });
    } catch (err) {
        next(err);
    }
});

// GET /api/todos/:id
router.get('/:id', async (req, res) => {
    try {
        const todo = await Todo.findById(req.params.id);
        if (!todo) return res.status(404).json({ error: 'Todo not found' });
        res.json({ todo });
    } catch (err) {
        // Catches malformed ObjectId (CastError) too.
        res.status(404).json({ error: 'Todo not found' });
    }
});

// PUT /api/todos/:id
router.put('/:id', async (req, res) => {
    try {
        const { title } = req.body || {};
        // TODO(candidate): the `completed` flag in the body is being ignored,
        // and a request for a non-existent id silently returns 200 with null.
        const todo = await Todo.findByIdAndUpdate(
            req.params.id,
            { ...(title !== undefined && { title }) },
            { new: true }
        );
        res.json({ todo });
    } catch (err) {
        res.status(404).json({ error: 'Todo not found' });
    }
});

// DELETE /api/todos/:id
router.delete('/:id', async (req, res) => {
    const t = await Todo.findByIdAndDelete(req.params.id); 
    if (!t) return res.status(404).json({ error: 'Todo not found' }); 
    res.json({ todo: t });
});

module.exports = router;
