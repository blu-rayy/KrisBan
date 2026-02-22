const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, 'frontend');
const frontendDistDir = path.join(frontendDir, 'dist');
const rootDistDir = path.join(__dirname, 'dist');

const SPA_ROUTES = ['dashboard', 'login', 'change-password'];

const createSpaRouteEntries = (distDir) => {
	const indexFile = path.join(distDir, 'index.html');

	if (!fs.existsSync(indexFile)) {
		throw new Error(`Missing index.html in ${distDir}`);
	}

	const indexContent = fs.readFileSync(indexFile, 'utf8');

	SPA_ROUTES.forEach((route) => {
		const routeDir = path.join(distDir, route);
		fs.mkdirSync(routeDir, { recursive: true });
		fs.writeFileSync(path.join(routeDir, 'index.html'), indexContent, 'utf8');
	});
};

console.log('Installing frontend dependencies...');
execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

console.log('Building frontend...');
execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

console.log('Creating SPA route entries in frontend dist...');
createSpaRouteEntries(frontendDistDir);

console.log('Preparing root dist output for Vercel...');
if (!fs.existsSync(frontendDistDir)) {
	throw new Error('Frontend build output not found at frontend/dist');
}

if (fs.existsSync(rootDistDir)) {
	fs.rmSync(rootDistDir, { recursive: true, force: true });
}

fs.cpSync(frontendDistDir, rootDistDir, { recursive: true });

console.log('Creating SPA route entries in root dist...');
createSpaRouteEntries(rootDistDir);

console.log('Build completed successfully!');
