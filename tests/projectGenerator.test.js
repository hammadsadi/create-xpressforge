import { describe, it, expect, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { generateProject } from '../src/generators/projectGenerator.js';

const mkTmp = () => path.join(os.tmpdir(), `xpressforge-test-${Date.now()}`);

describe('generateProject (integration)', () => {
  const dirs = [];
  afterEach(async () => {
    await Promise.all(dirs.map(d => fs.remove(d)));
    dirs.length = 0;
  });

  it('creates project directory', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(target)).toBe(true);
  });

  it('generates package.json with correct name', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'my-test-app', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    const pkg = await fs.readJson(path.join(target, 'package.json'));
    expect(pkg.name).toBe('my-test-app');
    expect(pkg.type).toBe('module');
  });

  it('generates .env and .env.example', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'mongodb', auth: 'jwt', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, '.env'))).toBe(true);
    expect(await fs.pathExists(path.join(target, '.env.example'))).toBe(true);
    const example = await fs.readFile(path.join(target, '.env.example'), 'utf8');
    // .env.example values should be empty
    expect(example).toMatch(/MONGO_URI=\s*\n/);
  });

  it('generates .gitignore', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    const gi = await fs.readFile(path.join(target, '.gitignore'), 'utf8');
    expect(gi).toContain('node_modules/');
    expect(gi).toContain('.env');
  });

  it('generates swagger config when swagger is selected', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: ['swagger'], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'config', 'swagger.js'))).toBe(true);
  });

  it('does NOT generate swagger config when not selected', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'config', 'swagger.js'))).toBe(false);
  });

  it('generates db.js when database is mongodb', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'mongodb', auth: 'none', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'config', 'db.js'))).toBe(true);
  });

  it('does NOT generate db.js when database is none', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'config', 'db.js'))).toBe(false);
  });

  it('generates auth files when jwt is selected', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'mongodb', auth: 'jwt', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'middlewares', 'authenticate.js'))).toBe(true);
    expect(await fs.pathExists(path.join(target, 'src', 'controllers', 'authController.js'))).toBe(true);
    expect(await fs.pathExists(path.join(target, 'src', 'routes', 'authRoutes.js'))).toBe(true);
  });

  it('generates modular structure correctly', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'modular', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'modules', 'user'))).toBe(true);
  });

  it('generates layered structure with repositories', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'layered', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'src', 'repositories'))).toBe(true);
  });

  it('generates tsconfig.json for TypeScript projects', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'ts' },
      target
    );
    expect(await fs.pathExists(path.join(target, 'tsconfig.json'))).toBe(true);
    const tsconfig = await fs.readJson(path.join(target, 'tsconfig.json'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('server.js loads dotenv', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
      target
    );
    const server = await fs.readFile(path.join(target, 'server.js'), 'utf8');
    expect(server).toContain("import 'dotenv/config'");
  });

  it('fails if directory already exists', async () => {
    const target = mkTmp();
    dirs.push(target);
    await fs.ensureDir(target);
    await expect(
      generateProject(
        { projectName: 'test', structure: 'mvc', database: 'none', auth: 'none', extras: [], language: 'js' },
        target
      )
    ).rejects.toThrow();
  });

  it('generates README.md', async () => {
    const target = mkTmp();
    dirs.push(target);
    await generateProject(
      { projectName: 'my-api', structure: 'mvc', database: 'mongodb', auth: 'jwt', extras: [], language: 'js' },
      target
    );
    const readme = await fs.readFile(path.join(target, 'README.md'), 'utf8');
    expect(readme).toContain('# my-api');
    expect(readme).toContain('create-xpressforge');
  });
});
