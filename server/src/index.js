const { createApp } = require('./app');
const { connect } = require('./db');

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await connect();
        const app = createApp();
        app.listen(PORT, () => {
            console.log(`API listening on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('failed to start server', err);
        process.exit(1);
    }
})();
