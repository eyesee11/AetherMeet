#!/usr/bin/env node

/**
 * Build script for CSS
 * Since we're using plain CSS with CSS variables,
 * we can simply copy and minify the CSS file
 */

const fs = require("fs");
const path = require("path");

const inputFile = "./public/css/style.css";
const outputFile = "./public/css/compiled.css";

console.log("📦 Building CSS...");

try {
  // Ensure output directory exists
  const outputDir = path.dirname(outputFile);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read CSS
  let css = fs.readFileSync(inputFile, "utf-8");
  
  // Simple minification: remove comments and extra whitespace
  css = css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove all comments
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .replace(/\s?([{}:;,])\s?/g, "$1") // Remove spaces around special chars
    .trim();

  // Write compiled CSS
  fs.writeFileSync(outputFile, css, "utf-8");
  
  const fileSize = (fs.statSync(outputFile).size / 1024).toFixed(2);
  console.log(`✓ CSS build completed successfully`);
  console.log(`✓ Output: ${outputFile} (${fileSize} KB)`);
} catch (error) {
  console.error("❌ Error building CSS:", error.message);
  process.exit(1);
}
