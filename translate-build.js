#!/usr/bin/env node

/**
 * translate-build.js - Generate translations.json using Google Translate API
 * 
 * Usage:
 *   node translate-build.js
 * 
 * This script reads all English strings from strings.js and generates
 * automatic translations to Hindi (hi) and Marathi (mr) using Google Translate API.
 * Results are saved to translations.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Supported languages
const TARGET_LANGUAGES = ['hi', 'mr']; // Hindi, Marathi

// Google Translate API - Free endpoint (no auth required)
// Uses the simple HTML scraping approach
async function translateText(text, targetLang) {
  return new Promise((resolve, reject) => {
    // Use MyMemory API - free, no auth required
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.responseStatus === 200 && json.responseData.translatedText) {
            resolve(json.responseData.translatedText);
          } else {
            console.warn(`⚠️ Translation failed for: "${text}"`);
            resolve(text); // Fallback to original
          }
        } catch (e) {
          console.warn(`⚠️ Parse error:`, e.message);
          resolve(text);
        }
      });
    }).on('error', (err) => {
      console.warn(`⚠️ API error:`, err.message);
      resolve(text);
    });
  });
}

// Recursively translate all strings in an object
async function translateObject(obj, targetLang, path = '') {
  const result = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string') {
      process.stdout.write(`\n  Translating (${fullPath}) to ${targetLang}...`);
      result[key] = await translateText(value, targetLang);
      process.stdout.write(` ✓`);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = await translateObject(value, targetLang, fullPath);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

// Main function
async function main() {
  console.log('\n🌐 ReliefMap Translation Builder');
  console.log('==================================\n');
  
  // Load English strings
  console.log('📖 Loading English strings from strings.js...');
  try {
    // Read the strings.js file
    const stringsPath = path.join(__dirname, 'strings.js');
    const stringsContent = fs.readFileSync(stringsPath, 'utf-8');
    
    // Extract the str object - simple regex to find window.str = {...}
    // Note: This is a simple approach. For complex JS, use a proper parser.
    const match = stringsContent.match(/window\.str\s*=\s*({[\s\S]*?}\s*;)/);
    if (!match) {
      throw new Error('Could not parse strings.js - window.str definition not found');
    }
    
    // Evaluate the object (safe in this context)
    const str = eval('(' + match[1].slice(0, -1) + ')'); // Remove trailing semicolon
    
    console.log(`✅ Loaded ${JSON.stringify(str).split('').length} characters of strings\n`);
    
    // Start translation
    const translations = { en: str };
    
    for (const lang of TARGET_LANGUAGES) {
      const langName = { hi: 'हिन्दी (Hindi)', mr: 'मराठी (Marathi)' }[lang];
      console.log(`\n🔤 Translating to ${langName}...`);
      console.log('─'.repeat(40));
      
      translations[lang] = await translateObject(str, lang);
      
      console.log(`\n✅ ${langName} translations complete!\n`);
    }
    
    // Save to translations.json
    const outputPath = path.join(__dirname, 'translations.json');
    fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));
    
    console.log(`\n📁 Saved translations to: ${outputPath}`);
    console.log(`📊 Languages available: en, ${TARGET_LANGUAGES.join(', ')}\n`);
    
    console.log('✨ Translation build complete! Deploy your app to Firebase Hosting.');
    console.log('   Users can now switch between English, Hindi, and Marathi.\n');
    
  } catch (error) {
    console.error('\n❌ Error during translation build:');
    console.error(error.message);
    process.exit(1);
  }
}

main();
