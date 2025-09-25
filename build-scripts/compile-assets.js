#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Compiling JavaScript and TypeScript assets...');

// Create output directory
const outputDir = './public/js/compiled';
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

function minifyJSFile(inputFile, outputFile) {
    try {
        const content = fs.readFileSync(inputFile, 'utf8');
        
        // Simple minification - remove comments and extra whitespace
        const minified = content
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
            .replace(/\/\/.*$/gm, '') // Remove line comments
            .replace(/^\s+/gm, '') // Remove leading whitespace
            .replace(/\s+$/gm, '') // Remove trailing whitespace
            .replace(/\n{2,}/g, '\n') // Remove multiple newlines
            .replace(/\s+/g, ' ') // Compress whitespace
            .trim();
        
        fs.writeFileSync(outputFile, minified);
        console.log(`  ✓ Minified: ${inputFile} → ${outputFile}`);
        return true;
    } catch (error) {
        console.error(`  ✗ Failed to minify ${inputFile}: ${error.message}`);
        return false;
    }
}

// Process client-side JavaScript files
const jsFiles = [
    { input: './public/js/auth.js', output: `${outputDir}/auth.min.js` },
    { input: './public/js/dashboard.js', output: `${outputDir}/dashboard.min.js` },
    { input: './public/js/room.js', output: `${outputDir}/room.min.js` },
    { input: './public/js/notes.js', output: `${outputDir}/notes.min.js` },
    { input: './public/js/i18n-frontend.js', output: `${outputDir}/i18n-frontend.min.js` }
];

let successCount = 0;
let totalFiles = 0;

jsFiles.forEach(({ input, output }) => {
    if (fs.existsSync(input)) {
        totalFiles++;
        if (minifyJSFile(input, output)) {
            successCount++;
        }
    } else {
        console.log(`  ⚠ File not found: ${input}`);
    }
});

// Create a combined file for common scripts
console.log('📦 Creating combined script bundle...');
const commonScripts = jsFiles
    .filter(({ input }) => fs.existsSync(input))
    .map(({ input }) => {
        try {
            return fs.readFileSync(input, 'utf8');
        } catch {
            return '';
        }
    })
    .join('\n');

if (commonScripts.trim()) {
    const combinedMinified = commonScripts
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .replace(/^\s+/gm, '')
        .replace(/\s+$/gm, '')
        .replace(/\n{2,}/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
    
    fs.writeFileSync(`${outputDir}/bundle.min.js`, combinedMinified);
    console.log(`  ✓ Created: ${outputDir}/bundle.min.js`);
}

// Process TypeScript files if any exist
const tsFiles = [];
if (fs.existsSync('./client/src')) {
    function findTSFiles(dir) {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                findTSFiles(fullPath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                tsFiles.push(fullPath);
            }
        });
    }
    findTSFiles('./client/src');
}

if (tsFiles.length > 0) {
    console.log('🔄 Found TypeScript files - they can be processed with a proper TypeScript compiler');
    tsFiles.forEach(file => console.log(`  • ${file}`));
}

console.log(`✅ Asset compilation completed: ${successCount}/${totalFiles} files processed`);