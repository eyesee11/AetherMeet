#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying build integrity...');

const requiredFiles = [
    './server.js',
    './package.json',
    './public/css/style.css'
];

const optionalFiles = [
    './public/css/compiled.css',
    './public/js/compiled/bundle.min.js'
];

const requiredDirectories = [
    './routes',
    './models',
    './middleware',
    './utils',
    './views',
    './public'
];

let allChecksPass = true;

// Check required files
console.log('📋 Checking required files...');
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ Missing required file: ${file}`);
        allChecksPass = false;
    }
});

// Check optional build artifacts
console.log('📦 Checking build artifacts...');
optionalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`  ✓ ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
    } else {
        console.log(`  ⚠ Optional file not found: ${file}`);
    }
});

// Check required directories
console.log('📁 Checking required directories...');
requiredDirectories.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        const files = fs.readdirSync(dir);
        console.log(`  ✓ ${dir} (${files.length} items)`);
    } else {
        console.log(`  ✗ Missing required directory: ${dir}`);
        allChecksPass = false;
    }
});

// Check package.json integrity
console.log('📄 Verifying package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    const requiredDeps = ['express', 'socket.io', 'mongoose', 'ejs'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies || !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
        console.log(`  ✓ All critical dependencies present`);
    } else {
        console.log(`  ✗ Missing dependencies: ${missingDeps.join(', ')}`);
        allChecksPass = false;
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
        console.log(`  ✓ Start script configured`);
    } else {
        console.log(`  ✗ No start script found`);
        allChecksPass = false;
    }
} catch (error) {
    console.log(`  ✗ Cannot parse package.json: ${error.message}`);
    allChecksPass = false;
}

// Environment variables check
console.log('🔧 Checking environment setup...');
const envFile = './.env';
if (fs.existsSync(envFile)) {
    console.log(`  ✓ .env file present`);
    
    try {
        const envContent = fs.readFileSync(envFile, 'utf8');
        const hasMongoUri = envContent.includes('MONGODB_URI') || envContent.includes('MONGO_URI');
        const hasJwtSecret = envContent.includes('JWT_SECRET');
        
        if (hasMongoUri) {
            console.log(`  ✓ Database connection configured`);
        } else {
            console.log(`  ⚠ Consider setting MONGODB_URI in .env`);
        }
        
        if (hasJwtSecret) {
            console.log(`  ✓ JWT secret configured`);
        } else {
            console.log(`  ⚠ Consider setting JWT_SECRET in .env`);
        }
    } catch (error) {
        console.log(`  ⚠ Cannot read .env file: ${error.message}`);
    }
} else {
    console.log(`  ⚠ No .env file found - create one for production`);
}

// Final build status
console.log('\n' + '='.repeat(50));
if (allChecksPass) {
    console.log('✅ Build verification PASSED - Ready for deployment!');
    process.exit(0);
} else {
    console.log('❌ Build verification FAILED - Fix errors before deployment');
    process.exit(1);
}