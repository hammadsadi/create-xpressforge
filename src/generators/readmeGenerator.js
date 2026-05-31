export function generateReadme(answers) {
  const { projectName, structure, database, auth, extras, language } = answers;

  const dbSetup = database === 'mongodb'
    ? `Set your \`MONGO_URI\` in \`.env\``
    : database !== 'none'
    ? `Set your \`DATABASE_URL\` in \`.env\`, then run:\n\`\`\`bash\nnpx prisma migrate dev\n\`\`\``
    : '';

  return `# ${projectName}

> Scaffolded with [create-xpressforge](https://github.com/hammad-sadi/create-xpressforge)

## Stack

| | |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Language | ${language === 'ts' ? 'TypeScript' : 'JavaScript'} |
| Structure | ${structure.toUpperCase()} |
| Database | ${database === 'none' ? 'None' : database.charAt(0).toUpperCase() + database.slice(1)} |
| Auth | ${auth === 'none' ? 'None' : auth.toUpperCase()} |

## Getting started

\`\`\`bash
npm install
cp .env.example .env   # fill in your values
${dbSetup}
npm run dev
\`\`\`

## Project structure

\`\`\`
src/
├── config/        # DB connection, env validation
├── controllers/   # Request handlers
├── middlewares/   # Auth, error handler, not-found
├── models/        # Data models / schemas
├── routes/        # Express routers
├── services/      # Business logic
└── utils/         # apiResponse, logger
\`\`\`

## API endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
${auth !== 'none' ? `| POST | /api/v1/auth/register | Register | No |
| POST | /api/v1/auth/login | Login | No |
| POST | /api/v1/auth/refresh | Refresh token | No |
| GET  | /api/v1/auth/me | Get current user | Yes |
` : ''}| GET  | /api/v1/users | List users | ${auth !== 'none' ? 'Yes' : 'No'} |
| GET  | /api/v1/users/:id | Get user | ${auth !== 'none' ? 'Yes' : 'No'} |
| PUT  | /api/v1/users/:id | Update user | ${auth !== 'none' ? 'Yes' : 'No'} |
| DELETE | /api/v1/users/:id | Delete user | ${auth !== 'none' ? 'Admin' : 'No'} |
| GET  | /health | Health check | No |

## Scripts

\`\`\`bash
npm run dev    # development with hot reload
npm start      # production
${language === 'ts' ? 'npm run build  # compile TypeScript\nnpm run lint   # type check' : ''}
\`\`\`

## Environment variables

See \`.env.example\` for all required variables.

---

Built with ❤️ by Hammad Sadi — powered by [create-xpressforge](https://npmjs.com/package/create-xpressforge)
`;
}
