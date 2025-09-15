// Script to check if all required dependencies are available

const requiredModules = [
  // Core modules
  'express',
  'cors',
  'helmet',
  'compression',
  'dotenv',
  
  // Database
  'pg',
  
  // Authentication
  'jsonwebtoken',
  'bcryptjs',
  'express-validator',
  
  // Real-time
  'socket.io',
  'ws',
  
  // Voice services
  'twilio',
  'axios',
  
  // AI/ML
  'openai',
  '@azure/openai',
  'natural',
  
  // Utilities
  'uuid',
  'pino',
];

console.log('Checking required dependencies...\n');

let missingCount = 0;

requiredModules.forEach(moduleName => {
  try {
    require.resolve(moduleName);
    console.log(`✓ ${moduleName} - OK`);
  } catch (e) {
    console.log(`✗ ${moduleName} - MISSING`);
    missingCount++;
  }
});

console.log(`\n${requiredModules.length - missingCount}/${requiredModules.length} dependencies available`);

if (missingCount > 0) {
  console.log('\nTo install missing dependencies, run:');
  console.log('npm install');
  process.exit(1);
} else {
  console.log('\nAll required dependencies are available!');
  process.exit(0);
}