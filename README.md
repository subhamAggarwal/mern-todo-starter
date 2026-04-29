# MERN Todo Starter

A minimal full-stack Todo app: **Express + MongoDB (in-memory) + React + Vite**.
This is the starter you build on for the assessment.

## Quick start

```bash
npm install
npm start
```

This launches:

- API on http://localhost:3000
- React dev server on http://localhost:5173 (proxies `/api` to the API)

## Test

```bash
npm test
```

These _visible_ tests live in `server/tests/`. They cover the basic happy path.
A separate set of **hidden tests** is run by the assessment platform when you
submit; the hidden set is a superset of these tests plus several edge cases.

## Project layout

```
.
├── server/
│   ├── src/
│   │   ├── app.js          # Express app (no listen) — exports createApp()
│   │   ├── db.js           # connect/disconnect to in-memory MongoDB
│   │   ├── index.js        # entrypoint: connect → app.listen
│   │   ├── models/Todo.js  # Mongoose model
│   │   └── routes/todos.js # CRUD routes (some bugs to fix!)
│   └── tests/todos.test.js # visible tests
└── client/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        └── App.css
```

## API

| Method | Path             | Description                  |
| ------ | ---------------- | ---------------------------- |
| GET    | `/api/health`    | Liveness probe               |
| GET    | `/api/todos`     | List all todos               |
| POST   | `/api/todos`     | Create a todo                |
| GET    | `/api/todos/:id` | Get one by id                |
| PUT    | `/api/todos/:id` | Update title and/or completed |
| DELETE | `/api/todos/:id` | Delete one                   |

## Your task

The starter has a few intentional issues. Read `server/src/routes/todos.js`
and the visible tests, then think about what the hidden tests might also
check:

1. **POST /api/todos** doesn't validate input. A request with no `title`
   should return a clear `400`, not the current `500`.
2. **PUT /api/todos/:id** ignores the `completed` flag. Make it work.
3. **PUT /api/todos/:id** with an unknown id silently returns `200` with
   `null`. Return `404`.
4. **DELETE /api/todos/:id** is stubbed (`501 Not Implemented`). Implement
   it: success should return `200` (or `204`), missing id should return `404`.

Make the visible tests pass — and try to anticipate the hidden ones.

## Notes

- We use [`mongodb-memory-server`](https://github.com/typegoose/mongodb-memory-server)
  so you don't need a local MongoDB install. The first start downloads the
  `mongod` binary (~150 MB), but in your assessment container this is
  pre-cached, so the IDE comes up fast.
- The React client expects the API at `/api/*`; Vite proxies that to port
  3000 (see `client/vite.config.js`).
- Environment: `PORT` (default 3000), optional `MONGO_URI` (if you want to
  point at a real cluster instead of the in-process server).
