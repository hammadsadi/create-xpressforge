export function generateEnv(answers) {
  const { database, auth, extras, projectName } = answers;

  let content = `# App
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3000

`;

  if (database === 'mongodb') {
    content += `# MongoDB
MONGO_URI=mongodb://localhost:27017/${projectName}

`;
  }

  if (database === 'postgresql') {
    content += `# PostgreSQL (Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/${projectName}?schema=public

`;
  }

  if (database === 'mysql') {
    content += `# MySQL (Prisma)
DATABASE_URL=mysql://user:password@localhost:3306/${projectName}

`;
  }

  if (auth === 'jwt') {
    content += `# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_this_too
JWT_REFRESH_EXPIRES_IN=30d

`;
  }

  if (auth === 'session') {
    content += `# Session
SESSION_SECRET=your_session_secret_change_this_in_production
SESSION_MAX_AGE=86400000

`;
  }

  if (extras.includes('multer')) {
    content += `# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

`;
  }

  return content.trimEnd() + '\n';
}
