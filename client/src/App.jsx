import React, { useEffect, useState } from 'react';

// Build API URLs relative to Vite's configured base so the client works
// both standalone (base='/', API='/api/todos') AND inside the hiretriple
// preview proxy (base='/api/ide/<sid>/preview/5173/',
// API='/api/ide/<sid>/preview/5173/api/todos', which our proxy forwards
// back to Vite which in turn hands off to the Express server on :3000 via
// vite.config.js `server.proxy`). Using a root-relative URL would bypass
// Vite entirely and hit the candidate-frontend backend origin instead.
const API = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

export default function App() {
    const [todos, setTodos] = useState([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(null);

    const reload = async () => {
        try {
            const res = await fetch(API('/api/todos'));
            if (!res.ok) throw new Error(`GET /api/todos -> ${res.status}`);
            const json = await res.json();
            setTodos(json.todos || []);
            setError(null);
        } catch (e) {
            setError(e.message);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const create = async (e) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        await fetch(API('/api/todos'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: trimmed }),
        });
        setTitle('');
        reload();
    };

    const toggle = async (todo) => {
        await fetch(API(`/api/todos/${todo.id}`), {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !todo.completed }),
        });
        reload();
    };

    const remove = async (id) => {
        await fetch(API(`/api/todos/${id}`), { method: 'DELETE' });
        reload();
    };

    return (
        <main className="container">
            <h1>Todos</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={create}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs doing?"
                    aria-label="Todo title"
                />
                <button type="submit">Add</button>
            </form>
            <ul>
                {todos.map((t) => (
                    <li key={t.id}>
                        <label className={t.completed ? 'done' : ''}>
                            <input
                                type="checkbox"
                                checked={!!t.completed}
                                onChange={() => toggle(t)}
                            />
                            {t.title}
                        </label>
                        <button
                            className="remove"
                            onClick={() => remove(t.id)}
                            aria-label={`Delete ${t.title}`}
                        >
                            ×
                        </button>
                    </li>
                ))}
            </ul>
        </main>
    );
}
