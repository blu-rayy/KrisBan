const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.join(__dirname, 'frontend');
const distDir = path.join(frontendDir, 'dist');

console.log('Frontend directory:', frontendDir);
console.log('Dist directory:', distDir);

try {
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

  console.log('Building frontend...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  // Verify the dist directory was created
  if (fs.existsSync(distDir)) {
    console.log('✓ Build completed successfully!');
    console.log('✓ Output directory:', distDir);
  } else {
    console.error('✗ Dist directory not found after build!');
    process.exit(1);
  }
} catch (error) {
  console.error('✗ Build failed:', error.message);
  process.exit(1);
}
