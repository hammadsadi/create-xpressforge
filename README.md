# create-xpressforge

> Production-ready Node.js + Express project scaffolder

[![npm version](https://img.shields.io/npm/v/create-xpressforge)](https://npmjs.com/package/create-xpressforge)
[![license](https://img.shields.io/npm/l/create-xpressforge)](LICENSE)

## Usage

```bash
npx create-xpressforge my-app
```

Or install globally:

```bash
npm install -g create-xpressforge
create-xpressforge my-app
```

## What you get

Interactive prompts let you choose:

- **Structure** — MVC, Modular (feature-based), or Layered (controller/service/repository)
- **Database** — MongoDB (Mongoose), PostgreSQL or MySQL (Prisma), or none
- **Auth** — JWT with refresh tokens, Session, or none
- **Extras** — Rate limiting, Helmet, CORS, Morgan, Validation, Multer, Socket.io, Swagger
- **Language** — JavaScript (ES Modules) or TypeScript

Every generated project includes:

- Global error handler with Mongoose/Prisma/JWT error detection
- Consistent `apiResponse` helper (`sendSuccess`, `sendError`, `sendPaginated`)
- Custom logger utility
- 404 not-found middleware
- Working User CRUD example
- `.env` + `.env.example` with all variables listed
- Auto-generated README with your stack details

## Author

Hammad Sadi <hammad.sadi@yahoo.com>

## License

MIT
