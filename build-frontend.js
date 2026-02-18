const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, 'frontend');

console.log('Installing frontend dependencies...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('Building frontend...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('Build completed successfully!');
