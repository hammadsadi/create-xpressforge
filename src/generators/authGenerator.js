import fs from 'fs-extra';
import path from 'path';

export async function generateAuthFiles(answers, targetDir, ext) {
  const { auth, database } = answers;

  if (auth === 'jwt') {
    // JWT middleware
    await fs.writeFile(
      path.join(targetDir, 'src', 'middlewares', `authenticate.${ext}`),
      jwtMiddleware()
    );

    // Auth controller
    await fs.ensureDir(path.join(targetDir, 'src', 'controllers'));
    await fs.writeFile(
      path.join(targetDir, 'src', 'controllers', `authController.${ext}`),
      authController(database)
    );

    // Auth routes
    await fs.writeFile(
      path.join(targetDir, 'src', 'routes', `authRoutes.${ext}`),
      authRoutes()
    );

    // User model (if DB)
    if (database === 'mongodb') {
      await fs.writeFile(
        path.join(targetDir, 'src', 'models', `User.${ext}`),
        userModelMongo()
      );
    }
  }

  if (auth === 'session') {
    await fs.writeFile(
      path.join(targetDir, 'src', 'middlewares', `sessionAuth.${ext}`),
      sessionMiddleware()
    );
  }
}

function jwtMiddleware() {
  return `import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  next();
};
`;
}

function authController(database) {
  const userImport = database === 'mongodb'
    ? `import User from '../models/User.js';`
    : `import { prisma } from '../config/db.js';`;

  return `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
${userImport}
import { env } from '../config/env.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const signToken = (payload, secret, expiresIn) =>
  jwt.sign(payload, secret, { expiresIn });

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await ${database === 'mongodb' ? 'User.findOne({ email })' : 'prisma.user.findUnique({ where: { email } })'};
    if (existing) return sendError(res, 'Email already registered', 409);

    const hashed = await bcrypt.hash(password, 12);
    const user = await ${database === 'mongodb'
      ? 'User.create({ name, email, password: hashed })'
      : 'prisma.user.create({ data: { name, email, password: hashed } })'};

    const accessToken  = signToken({ id: user._id || user.id, role: user.role }, env.JWT_SECRET, env.JWT_EXPIRES_IN);
    const refreshToken = signToken({ id: user._id || user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

    sendSuccess(res, { accessToken, refreshToken, user: { id: user._id || user.id, name: user.name, email: user.email } }, 'Registered successfully', 201);
  } catch (err) { next(err); }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await ${database === 'mongodb'
      ? 'User.findOne({ email }).select(\'+password\')'
      : 'prisma.user.findUnique({ where: { email } })'};
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const accessToken  = signToken({ id: user._id || user.id, role: user.role }, env.JWT_SECRET, env.JWT_EXPIRES_IN);
    const refreshToken = signToken({ id: user._id || user.id }, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

    sendSuccess(res, { accessToken, refreshToken, user: { id: user._id || user.id, name: user.name, email: user.email } }, 'Login successful');
  } catch (err) { next(err); }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return sendError(res, 'Refresh token required', 401);

    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    const accessToken = signToken({ id: decoded.id }, env.JWT_SECRET, env.JWT_EXPIRES_IN);
    sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch (err) { next(err); }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await ${database === 'mongodb'
      ? 'User.findById(req.user.id).select(\'-password\')'
      : 'prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, role: true, createdAt: true } })'};
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};
`;
}

function authRoutes() {
  return `import { Router } from 'express';
import { register, login, refreshToken, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/refresh',  refreshToken);
router.get('/me',        authenticate, getMe);

export default router;
`;
}

function userModelMongo() {
  return `import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\\S+@\\S+\\.\\S+$/, 'Invalid email format'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
}, { timestamps: true });

userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
export default User;
`;
}

function sessionMiddleware() {
  return `export const requireAuth = (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  next();
};
`;
}
