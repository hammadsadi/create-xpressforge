import fs from 'fs-extra';
import path from 'path';

export async function generateStructure(answers, targetDir) {
  const { structure, database, auth } = answers;
  const ext = answers.language === 'ts' ? 'ts' : 'js';

  const base = (p) => path.join(targetDir, p);

  // Common folders
  const commonDirs = [
    'src/config',
    'src/middlewares',
    'src/utils',
    'src/routes',
  ];

  if (structure === 'mvc') {
    const dirs = [
      ...commonDirs,
      'src/controllers',
      'src/models',
      'src/services',
    ];
    await Promise.all(dirs.map(d => fs.ensureDir(base(d))));
    await writeMvcFiles(answers, targetDir, ext);
  }

  if (structure === 'modular') {
    const dirs = [
      ...commonDirs,
      'src/modules/user/controller',
      'src/modules/user/service',
      'src/modules/user/model',
      'src/modules/user/routes',
      'src/modules/user/dto',
    ];
    await Promise.all(dirs.map(d => fs.ensureDir(base(d))));
    await writeModularFiles(answers, targetDir, ext);
  }

  if (structure === 'layered') {
    const dirs = [
      ...commonDirs,
      'src/controllers',
      'src/services',
      'src/repositories',
      'src/models',
    ];
    await Promise.all(dirs.map(d => fs.ensureDir(base(d))));
    await writeLayeredFiles(answers, targetDir, ext);
  }
}

async function writeMvcFiles(answers, targetDir, ext) {
  const base = (p) => path.join(targetDir, p);

  // Example User controller
  await fs.writeFile(base(`src/controllers/userController.${ext}`), `import { sendSuccess, sendError, sendPaginated } from '../utils/apiResponse.js';
${answers.database === 'mongodb' ? "import User from '../models/User.js';" : "import { prisma } from '../config/db.js';"}

export const getAllUsers = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    ${answers.database === 'mongodb'
      ? `const [users, total] = await Promise.all([\n      User.find().select('-password').skip(skip).limit(limit).lean(),\n      User.countDocuments(),\n    ]);`
      : `const [users, total] = await Promise.all([\n      prisma.user.findMany({ skip, take: limit, select: { id: true, name: true, email: true, role: true, createdAt: true } }),\n      prisma.user.count(),\n    ]);`}

    sendPaginated(res, users, { total, page, limit });
  } catch (err) { next(err); }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await ${answers.database === 'mongodb'
      ? "User.findById(req.params.id).select('-password')"
      : "prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, role: true } })"};
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await ${answers.database === 'mongodb'
      ? "User.findByIdAndUpdate(req.params.id, { name }, { new: true, runValidators: true }).select('-password')"
      : "prisma.user.update({ where: { id: req.params.id }, data: { name }, select: { id: true, name: true, email: true } })"};
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user, 'User updated');
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await ${answers.database === 'mongodb'
      ? "User.findByIdAndDelete(req.params.id)"
      : "prisma.user.delete({ where: { id: req.params.id } })"};
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, null, 'User deleted');
  } catch (err) { next(err); }
};
`);

  // Routes index
  await fs.writeFile(base(`src/routes/index.${ext}`), `import { Router } from 'express';
import userRoutes from './userRoutes.js';
${answers.auth !== 'none' ? "import authRoutes from './authRoutes.js';" : ''}

const router = Router();

${answers.auth !== 'none' ? "router.use('/auth',  authRoutes);" : ''}
router.use('/users', userRoutes);

export default router;
`);

  // User routes
  await fs.writeFile(base(`src/routes/userRoutes.${ext}`), `import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
${answers.auth === 'jwt' ? "import { authenticate, authorize } from '../middlewares/authenticate.js';" : ''}

const router = Router();

${answers.auth === 'jwt' ? "router.use(authenticate);" : ''}
router.get('/',     getAllUsers);
router.get('/:id',  getUserById);
router.put('/:id',  updateUser);
router.delete('/:id', ${answers.auth === 'jwt' ? "authorize('admin'), " : ''}deleteUser);

export default router;
`);
}

async function writeModularFiles(answers, targetDir, ext) {
  const base = (p) => path.join(targetDir, p);

  // user module controller
  await fs.writeFile(base(`src/modules/user/controller/user.controller.${ext}`), `import { UserService } from '../service/user.service.js';
import { sendSuccess, sendError } from '../../../utils/apiResponse.js';

const userService = new UserService();

export const getUsers = async (req, res, next) => {
  try {
    const users = await userService.findAll();
    sendSuccess(res, users);
  } catch (err) { next(err); }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) return sendError(res, 'User not found', 404);
    sendSuccess(res, user);
  } catch (err) { next(err); }
};
`);

  // user service
  await fs.writeFile(base(`src/modules/user/service/user.service.${ext}`), `${answers.database === 'mongodb' ? "import User from '../model/user.model.js';" : "import { prisma } from '../../../config/db.js';"}

export class UserService {
  async findAll() {
    return ${answers.database === 'mongodb' ? "User.find().select('-password').lean()" : "prisma.user.findMany({ select: { id: true, name: true, email: true } })"};
  }
  async findById(id) {
    return ${answers.database === 'mongodb' ? "User.findById(id).select('-password')" : "prisma.user.findUnique({ where: { id } })"};
  }
}
`);

  // user routes
  await fs.writeFile(base(`src/modules/user/routes/user.routes.${ext}`), `import { Router } from 'express';
import { getUsers, getUser } from '../controller/user.controller.js';

const router = Router();
router.get('/', getUsers);
router.get('/:id', getUser);
export default router;
`);

  // main routes index
  await fs.writeFile(base(`src/routes/index.${ext}`), `import { Router } from 'express';
import userRoutes from '../modules/user/routes/user.routes.js';
${answers.auth !== 'none' ? "import authRoutes from './authRoutes.js';" : ''}

const router = Router();
${answers.auth !== 'none' ? "router.use('/auth', authRoutes);" : ''}
router.use('/users', userRoutes);
export default router;
`);
}

async function writeLayeredFiles(answers, targetDir, ext) {
  const base = (p) => path.join(targetDir, p);

  // Repository layer
  await fs.writeFile(base(`src/repositories/userRepository.${ext}`), `${answers.database === 'mongodb' ? "import User from '../models/User.js';" : "import { prisma } from '../config/db.js';"}

export class UserRepository {
  async findAll({ skip = 0, limit = 10 } = {}) {
    return ${answers.database === 'mongodb' ? "User.find().select('-password').skip(skip).limit(limit).lean()" : "prisma.user.findMany({ skip, take: limit, select: { id: true, name: true, email: true } })"};
  }
  async findById(id) {
    return ${answers.database === 'mongodb' ? "User.findById(id).select('-password')" : "prisma.user.findUnique({ where: { id } })"};
  }
  async findByEmail(email) {
    return ${answers.database === 'mongodb' ? "User.findOne({ email })" : "prisma.user.findUnique({ where: { email } })"};
  }
  async update(id, data) {
    return ${answers.database === 'mongodb' ? "User.findByIdAndUpdate(id, data, { new: true }).select('-password')" : "prisma.user.update({ where: { id }, data })"};
  }
  async delete(id) {
    return ${answers.database === 'mongodb' ? "User.findByIdAndDelete(id)" : "prisma.user.delete({ where: { id } })"};
  }
}
`);

  // Service layer
  await fs.writeFile(base(`src/services/userService.${ext}`), `import { UserRepository } from '../repositories/userRepository.js';

export class UserService {
  constructor() { this.repo = new UserRepository(); }

  async getAllUsers(query) { return this.repo.findAll(query); }
  async getUserById(id) {
    const user = await this.repo.findById(id);
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }
  async updateUser(id, data) { return this.repo.update(id, data); }
  async deleteUser(id) { return this.repo.delete(id); }
}
`);

  // Controller
  await fs.writeFile(base(`src/controllers/userController.${ext}`), `import { UserService } from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';

const userService = new UserService();

export const getAllUsers  = async (req, res, next) => { try { sendSuccess(res, await userService.getAllUsers(req.query)); } catch(e){next(e);} };
export const getUserById  = async (req, res, next) => { try { sendSuccess(res, await userService.getUserById(req.params.id)); } catch(e){next(e);} };
export const updateUser   = async (req, res, next) => { try { sendSuccess(res, await userService.updateUser(req.params.id, req.body), 'User updated'); } catch(e){next(e);} };
export const deleteUser   = async (req, res, next) => { try { await userService.deleteUser(req.params.id); sendSuccess(res, null, 'User deleted'); } catch(e){next(e);} };
`);

  // Routes
  await fs.writeFile(base(`src/routes/index.${ext}`), `import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController.js';
${answers.auth !== 'none' ? "import authRoutes from './authRoutes.js';\nimport { authenticate } from '../middlewares/authenticate.js';" : ''}

const router = Router();
${answers.auth !== 'none' ? "router.use('/auth', authRoutes);" : ''}
router.get('/users',     ${answers.auth === 'jwt' ? 'authenticate, ' : ''}getAllUsers);
router.get('/users/:id', ${answers.auth === 'jwt' ? 'authenticate, ' : ''}getUserById);
router.put('/users/:id', ${answers.auth === 'jwt' ? 'authenticate, ' : ''}updateUser);
router.delete('/users/:id', ${answers.auth === 'jwt' ? 'authenticate, ' : ''}deleteUser);
export default router;
`);
}
