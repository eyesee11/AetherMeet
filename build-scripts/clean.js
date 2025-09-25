#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning build artifacts...');

const cleanTargets = [
    './public/css/compiled.css',
    './public/css/compiled.css.map',
    './public/js/compiled',
    './temp/build-cache',
    './node_modules/.cache'
];

function removeIfExists(filePath) {
    try {
        const fullPath = path.resolve(filePath);
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                fs.rmSync(fullPath, { recursive: true, force: true });
                console.log(`  ✓ Removed directory: ${filePath}`);
            } else {
                fs.unlinkSync(fullPath);
                console.log(`  ✓ Removed file: ${filePath}`);
            }
        }
    } catch (error) {
        console.log(`  ⚠ Could not remove ${filePath}: ${error.message}`);
    }
}

// Clean build artifacts
cleanTargets.forEach(removeIfExists);

// Ensure required directories exist
const requiredDirs = [
    './public/css',
    './public/js',
    './temp'
];

requiredDirs.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`  ✓ Created directory: ${dir}`);
        }
    } catch (error) {
        console.error(`  ✗ Could not create directory ${dir}: ${error.message}`);
    }
});

console.log('✅ Clean completed');