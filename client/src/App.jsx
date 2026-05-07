import React, { useEffect, useState, useCallback, useRef } from 'react';

// Build API URLs relative to Vite's configured base so the client works
// both standalone (base='/', API='/api/todos') AND inside the hiretriple
// preview proxy (base='/api/ide/<sid>/preview/5173/',
// API='/api/ide/<sid>/preview/5173/api/todos', which our proxy forwards
// back to Vite which in turn hands off to the Express server on :3000 via
// vite.config.js `server.proxy`). Using a root-relative URL would bypass
// Vite entirely and hit the candidate-frontend backend origin instead.
const API = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

const STORAGE_KEY = 'todo-draft';

export default function App() {
    const [todos, setTodos] = useState([]);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, completed
    const [searchQuery, setSearchQuery] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [toast, setToast] = useState(null);
    const editInputRef = useRef(null);

    // Load draft from localStorage on mount
    useEffect(() => {
        const draft = localStorage.getItem(STORAGE_KEY);
        if (draft) setTitle(draft);
    }, []);

    // Save draft to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, title);
    }, [title]);

    // Focus edit input when editing starts
    useEffect(() => {
        if (editingId && editInputRef.current) {
            editInputRef.current.focus();
        }
    }, [editingId]);

    const reload = async (queryParams = {}) => {
        try {
            const queryString = new URLSearchParams(queryParams).toString();
            const url = queryString ? `/api/todos?${queryString}` : '/api/todos';
            const res = await fetch(API(url));
            if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
            const json = await res.json();
            setTodos(json.todos || []);
            setError(null);
        } catch (e) {
            setError(e.message);
            showToast(`Failed to load todos: ${e.message}`);
        }
    };

    useEffect(() => {
        const queryParams = {};
        if (filter !== 'all') queryParams.status = filter;
        if (searchQuery) queryParams.q = searchQuery;
        reload(queryParams);
    }, [filter, searchQuery]);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 3000);
    };

    const create = async (e) => {
        e.preventDefault();
        const trimmed = title.trim();
        if (!trimmed) return;
        try {
            const res = await fetch(API('/api/todos'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: trimmed }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to create todo');
            }
            setTitle('');
            localStorage.removeItem(STORAGE_KEY);
            reload();
        } catch (e) {
            showToast(`Failed to add todo: ${e.message}`);
        }
    };

    const toggle = async (todo) => {
        try {
            const res = await fetch(API(`/api/todos/${todo.id}/toggle`), {
                method: 'PATCH',
            });
            if (!res.ok) throw new Error('Failed to toggle todo');
            const json = await res.json();
            setTodos(todos.map((t) => (t.id === todo.id ? json.todo : t)));
        } catch (e) {
            showToast(`Failed to toggle: ${e.message}`);
            reload();
        }
    };

    const remove = async (id) => {
        try {
            const res = await fetch(API(`/api/todos/${id}`), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete todo');
            reload();
        } catch (e) {
            showToast(`Failed to delete: ${e.message}`);
        }
    };

    const clearCompleted = async () => {
        try {
            const res = await fetch(API('/api/todos?status=completed'), { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to clear completed');
            reload();
        } catch (e) {
            showToast(`Failed to clear completed: ${e.message}`);
        }
    };

    const startEdit = (todo) => {
        setEditingId(todo.id);
        setEditTitle(todo.title);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditTitle('');
    };

    const saveEdit = async (id) => {
        const trimmed = editTitle.trim();
        if (!trimmed) return;
        try {
            const res = await fetch(API(`/api/todos/${id}`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: trimmed }),
            });
            if (!res.ok) throw new Error('Failed to update todo');
            setEditingId(null);
            setEditTitle('');
            reload();
        } catch (e) {
            showToast(`Failed to update: ${e.message}`);
        }
    };

    const handleKeyDown = (e, todo) => {
        if (e.key === 'Enter') {
            if (editingId === todo.id) {
                saveEdit(todo.id);
            } else {
                startEdit(todo);
            }
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    };

    const handleAddKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            create(e);
        }
    };

    const activeCount = todos.filter((t) => !t.completed).length;
    const filteredTodos = todos;

    const priorityColors = {
        low: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        high: 'bg-red-100 text-red-800',
    };

    return (
        <main className="container">
            <h1>Todos</h1>
            {error && <p className="error">{error}</p>}
            
            <form onSubmit={create}>
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="What needs to be done?"
                    aria-label="add todo"
                />
                <button type="submit" aria-label="add todo">Add</button>
            </form>

            <div className="controls">
                <div className="filter-chips" role="tablist">
                    {['all', 'active', 'completed'].map((f) => (
                        <button
                            key={f}
                            role="tab"
                            aria-selected={filter === f}
                            className={filter === f ? 'active' : ''}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search"
                    aria-label="search todos"
                />
            </div>

            <div className="status-bar">
                <span data-testid="items-left">{activeCount} item{activeCount !== 1 ? 's' : ''} left</span>
                {activeCount < todos.length && (
                    <button onClick={clearCompleted} className="clear-btn">
                        Clear completed
                    </button>
                )}
            </div>

            {filteredTodos.length === 0 ? (
                <div className="empty-state">
                    <p>No todos found</p>
                    {searchQuery && <p>Try a different search term</p>}
                </div>
            ) : (
                <ul>
                    {filteredTodos.map((t) => (
                        <li key={t.id} role="listitem" className={t.completed ? 'done' : ''}>
                            <label>
                                <input
                                    type="checkbox"
                                    role="checkbox"
                                    checked={!!t.completed}
                                    onChange={() => toggle(t)}
                                    aria-label={`Mark ${t.title} as ${t.completed ? 'incomplete' : 'complete'}`}
                                />
                                {editingId === t.id ? (
                                    <input
                                        ref={editInputRef}
                                        type="text"
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        onBlur={() => saveEdit(t.id)}
                                        onKeyDown={(e) => handleKeyDown(e, t)}
                                        className="edit-input"
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={() => startEdit(t)}
                                        title="Double-click to edit"
                                    >
                                        {t.title}
                                    </span>
                                )}
                            </label>
                            {t.priority && (
                                <span className={`priority-badge ${priorityColors[t.priority]}`}>
                                    {t.priority}
                                </span>
                            )}
                            {t.dueDate && (
                                <span className="due-date">
                                    Due: {new Date(t.dueDate).toLocaleDateString()}
                                </span>
                            )}
                            <button
                                className="remove"
                                onClick={() => remove(t.id)}
                                aria-label={`delete ${t.title}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {toast && <div className="toast">{toast}</div>}
        </main>
    );
}
