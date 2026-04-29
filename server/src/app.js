const express = require('express');
const cors = require('cors');
const todosRouter = require('./routes/todos');

function createApp() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
    app.use('/api/todos', todosRouter);

    // 404
    app.use((req, res) => res.status(404).json({ error: 'Not found' }));

    // Global error handler. Note: this currently turns every error — including
    // mongoose ValidationError — into a 500. That's intentional starter
    // behaviour; the candidate is expected to surface 4xx errors per route.
    // eslint-disable-next-line no-unused-vars
    app.use((err, req, res, _next) => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    });

    return app;
}

module.exports = { createApp };
