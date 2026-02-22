const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, 'frontend');
const frontendDistDir = path.join(frontendDir, 'dist');
const rootDistDir = path.join(__dirname, 'dist');

console.log('Installing frontend dependencies...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('Building frontend...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('Preparing root dist output for Vercel...');
if (!fs.existsSync(frontendDistDir)) {
	throw new Error('Frontend build output not found at frontend/dist');
}

if (fs.existsSync(rootDistDir)) {
	fs.rmSync(rootDistDir, { recursive: true, force: true });
}

fs.cpSync(frontendDistDir, rootDistDir, { recursive: true });

console.log('Build completed successfully!');
