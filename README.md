# create-xpressforge

> Scaffold a production-ready Node.js + Express project in seconds — with your choice of architecture, database, auth, and language.

[![npm version](https://img.shields.io/npm/v/create-xpressforge)](https://npmjs.com/package/create-xpressforge)
[![license](https://img.shields.io/npm/l/create-xpressforge)](LICENSE)
[![tests](https://img.shields.io/badge/tests-73%20passed-brightgreen)](#)

---

## Quick start

```bash
npx create-xpressforge my-app
```

That's it. Follow the prompts, then:

```bash
cd my-app
npm install
cp .env.example .env   # add your DB URI and secrets
npm run dev
```

---

## Interactive prompts

```
? Project name:          my-app
? Project structure:     MVC  /  Modular  /  Layered
? Database:              MongoDB  /  PostgreSQL  /  MySQL  /  None
? Authentication:        JWT  /  Session  /  None
? Extra features:        Rate limiting, Helmet, CORS, Morgan, Validation, Multer, Socket.io, Swagger
? Language:              JavaScript  /  TypeScript
```

---

## What gets generated

Running `npx create-xpressforge my-app` with **MVC + MongoDB + JWT** produces:

```
my-app/
├── src/
│   ├── config/
│   │   ├── db.js          # MongoDB connection with retry logic
│   │   └── env.js         # Centralised env config
│   ├── controllers/
│   │   ├── authController.js   # register, login, refresh, getMe
│   │   └── userController.js   # full CRUD with pagination
│   ├── middlewares/
│   │   ├── authenticate.js     # JWT verify + role-based authorize()
│   │   ├── errorHandler.js     # global error handler
│   │   └── notFound.js
│   ├── models/
│   │   └── User.js             # Mongoose schema with indexes
│   ├── routes/
│   │   ├── index.js
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── services/
│   │   └── userService.js
│   └── utils/
│       ├── apiResponse.js      # sendSuccess / sendError / sendPaginated
│       └── logger.js           # coloured console logger
├── .env                        # pre-filled with your choices
├── .env.example                # safe to commit
├── .gitignore
├── package.json
├── README.md                   # auto-generated for your stack
└── server.js
```

---

## API endpoints (out of the box)

| Method   | Endpoint                | Description          | Auth     |
| -------- | ----------------------- | -------------------- | -------- |
| `POST`   | `/api/v1/auth/register` | Register a new user  | —        |
| `POST`   | `/api/v1/auth/login`    | Login, get tokens    | —        |
| `POST`   | `/api/v1/auth/refresh`  | Refresh access token | —        |
| `GET`    | `/api/v1/auth/me`       | Get current user     | ✅       |
| `GET`    | `/api/v1/users`         | Paginated user list  | ✅       |
| `GET`    | `/api/v1/users/:id`     | Get user by ID       | ✅       |
| `PUT`    | `/api/v1/users/:id`     | Update user          | ✅       |
| `DELETE` | `/api/v1/users/:id`     | Delete user          | ✅ Admin |
| `GET`    | `/health`               | Health check         | —        |

---

## Consistent API response format

Every endpoint returns the same shape — no surprises:

```json
// success
{ "success": true,  "message": "Login successful", "data": { ... } }

// error
{ "success": false, "message": "Invalid email or password" }

// paginated
{ "success": true, "data": [...], "pagination": { "total": 100, "page": 2, "limit": 10, "totalPages": 10 } }
```

---

## Available scripts

```bash
npm run dev      # nodemon hot-reload (JS) / tsx watch (TS)
npm start        # production
npm run build    # compile TypeScript  (TS only)
npm test         # vitest
```

---

## Global install

```bash
npm install -g create-xpressforge
create-xpressforge my-app
```

---

## Author

**Hammad Sadi** · [hammad.sadi@yahoo.com](mailto:hammad.sadi@yahoo.com)

## License

MIT
