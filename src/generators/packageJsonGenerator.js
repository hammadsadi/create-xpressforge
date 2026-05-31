export function generatePackageJson(answers) {
  const { projectName, database, auth, extras, language } = answers;

  const deps = {
    express: '^5.0.0',
  };

  const devDeps = {
    nodemon: '^3.1.0',
  };

  if (database === 'mongodb')    deps['mongoose']         = '^8.0.0';
  if (database === 'postgresql' || database === 'mysql') {
    deps['@prisma/client'] = '^5.0.0';
    devDeps['prisma']      = '^5.0.0';
  }

  if (auth === 'jwt')     { deps['jsonwebtoken'] = '^9.0.0'; deps['bcryptjs'] = '^2.4.3'; }
  if (auth === 'session') { deps['express-session'] = '^1.18.0'; deps['connect-mongo'] = '^5.1.0'; }

  if (extras.includes('cors'))       deps['cors']                = '^2.8.5';
  if (extras.includes('helmet'))     deps['helmet']              = '^7.1.0';
  if (extras.includes('morgan'))     deps['morgan']              = '^1.10.0';
  if (extras.includes('rateLimit'))  deps['express-rate-limit']  = '^7.0.0';
  if (extras.includes('validation')) deps['express-validator']   = '^7.0.0';
  if (extras.includes('multer'))     deps['multer']              = '^1.4.5';
  if (extras.includes('socket'))     deps['socket.io']           = '^4.7.0';
  if (extras.includes('swagger')) {
    deps['swagger-ui-express'] = '^5.0.0';
    deps['swagger-jsdoc']      = '^6.2.8';
  }

  deps['dotenv'] = '^16.4.0';

  if (language === 'ts') {
    devDeps['typescript']           = '^5.4.0';
    devDeps['tsx']                  = '^4.7.0';
    devDeps['@types/node']          = '^20.0.0';
    devDeps['@types/express']       = '^5.0.0';
    if (deps['cors'])           devDeps['@types/cors']         = '^2.8.17';
    if (deps['morgan'])         devDeps['@types/morgan']       = '^1.9.9';
    if (deps['bcryptjs'])       devDeps['@types/bcryptjs']     = '^2.4.6';
    if (deps['jsonwebtoken'])   devDeps['@types/jsonwebtoken'] = '^9.0.6';
    if (deps['multer'])         devDeps['@types/multer']       = '^1.4.11';
  }

  const scripts = language === 'ts'
    ? {
        dev:   'tsx watch server.ts',
        build: 'tsc',
        start: 'node dist/server.js',
        lint:  'tsc --noEmit',
      }
    : {
        dev:   'nodemon server.js',
        start: 'node server.js',
      };

  return {
    name: projectName,
    version: '1.0.0',
    description: '',
    type: 'module',
    main: language === 'ts' ? 'dist/server.js' : 'server.js',
    scripts,
    dependencies: deps,
    devDependencies: devDeps,
    engines: { node: '>=18.0.0' },
  };
}
