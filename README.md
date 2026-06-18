# MERN Todo Starter

A full-stack Todo app: **Express + MongoDB (in-memory) + React + Vite**.
This is the starter you build on for the assessment.

## Quick start

```bash
npm start
```

This launches:

- API on http://localhost:3000
- React dev server on http://localhost:5173 (proxies `/api` to the API)

## Test

```bash
npm test
```

Visible tests live in `server/tests/`. Hidden tests (backend + frontend) are run
by the assessment platform when you submit.

## Project layout

```
.
├── server/
│   ├── src/
│   │   ├── app.js          # Express app (no listen) — exports createApp()
│   │   ├── db.js           # connect/disconnect to in-memory MongoDB
│   │   ├── index.js        # entrypoint: connect → app.listen
│   │   ├── models/Todo.js  # Mongoose model
│   │   └── routes/todos.js # CRUD routes
│   └── tests/todos.test.js # visible tests
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── App.css
```

## Todo Model

The Todo model includes these fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | String | Yes | Max 200 characters |
| `description` | String | No | Max 500 characters |
| `completed` | Boolean | No | Default `false` |
| `priority` | Enum | No | `low`, `medium`, `high` (default: `medium`) |
| `dueDate` | Date | No | ISO date string |
| `tags` | Array | No | Max 5 string entries |
| `position` | Number | No | Non-negative integer for ordering (default: `0`) |

## API

| Method | Path | Description | Query Params |
| ------ | ---- | ----------- | ------------ |
| GET | `/api/health` | Liveness probe | - |
| GET | `/api/todos` | List todos | `status` (active/completed), `priority` (low/medium/high), `q` (search), `sort` (createdAt/priority/dueDate), `limit`, `offset` |
| POST | `/api/todos` | Create a todo | Body: `{ title, description?, priority?, dueDate?, tags?, position? }` |
| GET | `/api/todos/:id` | Get one by id | - |
| PUT | `/api/todos/:id` | Update todo | Body: `{ title?, description?, priority?, dueDate?, tags?, position?, completed? }` |
| PATCH | `/api/todos/:id/toggle` | Toggle completed status | - |
| DELETE | `/api/todos/:id` | Delete one | - |
| DELETE | `/api/todos` | Bulk delete | Query: `status=completed` |
| POST | `/api/todos/reorder` | Reorder todos | Body: `{ items: [{ id, position }, ...] }` |

### Validation Rules

- **400 Bad Request**: Invalid body shape, missing required fields, constraint violations
- **404 Not Found**: Resource not found (invalid ObjectId or non-existent document)
- **422 Unprocessable Entity**: Mongoose validation errors

## Your Task

Implement a fully functional Todo application with the following features:

### Backend Requirements

1. **Input Validation**: Return `400` for invalid requests (missing title, empty strings, field length violations, invalid enum values)
2. **CRUD Operations**: Properly implement GET, POST, PUT, DELETE with correct status codes
3. **Filtering**: Support filtering by `status` (active/completed) and `priority`
4. **Search**: Support text search across `title` and `description` fields (case-insensitive)
5. **Sorting**: Support sorting by `createdAt`, `priority`, or `dueDate`
6. **Toggle Endpoint**: Implement `PATCH /api/todos/:id/toggle` to flip completion status
7. **Bulk Delete**: Implement `DELETE /api/todos?status=completed` to remove all completed todos
8. **Reorder**: Implement `POST /api/todos/reorder` to update positions in bulk

### Frontend Requirements

The React app must implement these features with **stable selectors** (see `SELECTOR_CONTRACT.md` in the hidden tests):

1. **Filter Chips**: All / Active / Completed tabs with `role="tab"` and `role="tablist"`
2. **Search Box**: Input with `placeholder="Search..."` and `aria-label="search todos"`
3. **Add Input**: Input with `placeholder="What needs to be done?"` and `aria-label="add todo"`
4. **Item Counter**: Element with `data-testid="items-left"` showing incomplete count (e.g., "2 items left")
5. **Inline Edit**: Double-click todo title to edit, Enter to save, Escape to cancel
6. **Keyboard Shortcuts**: Enter in add input submits form, Enter on todo text starts edit
7. **Priority Badges**: Display priority level with `className="priority-badge"`
8. **Due Dates**: Display due dates with `className="due-date"`
9. **Clear Completed**: Button with text "Clear completed" when completed todos exist
10. **Empty State**: Display "No todos found" when no todos match filter
11. **Error Toasts**: Show error messages on API failures
12. **LocalStorage**: Persist new-todo input draft across page refreshes

### Stable Selectors (Critical for Hidden Tests)

Hidden frontend tests rely on these selectors:

- Add input: `placeholder="What needs to be done?"`, `aria-label="add todo"`
- Search input: `placeholder="Search..."`, `aria-label="search todos"`
- Filter chips: `role="tab"` with text "All", "Active", "Completed"
- Todo items: `role="listitem"`
- Checkboxes: `role="checkbox"`
- Delete buttons: `aria-label` contains "delete" (case-insensitive)
- Item counter: `data-testid="items-left"`
- Empty state: text "No todos found"

See `dummy-project-hidden/SELECTOR_CONTRACT.md` (provided after submission) for the full contract.

## Notes

- We use [`mongodb-memory-server`](https://github.com/typegoose/mongodb-memory-server)
  so you don't need a local MongoDB install.
- The React client expects the API at `/api/*`; Vite proxies that to port
  3000 (see `client/vite.config.js`).
- Environment: `PORT` (default 3000), optional `MONGO_URI`.

Best of Luck!

## Development Guide

### How to Run Locally

> **⚠️ CRITICAL: Port Binding**
> To be evaluated, your servers MUST bind to `0.0.0.0` (all interfaces) rather than `localhost` or `127.0.0.1`.

This is a full-stack application. You must run both the backend and frontend servers simultaneously in separate terminal tabs.

**1. Start the Backend Server (Port 5000)**
```bash
npm start
```

**2. Start the Frontend Server (Port 5173)**
```bash
cd client && npm run dev
```

### How to Test

You can execute the visible test suite locally to verify your solution against the visible test cases:
```bash
npm test
```

When you click **Submit**, the platform will run an identical evaluation suite against your code using the same command.
