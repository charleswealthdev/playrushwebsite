const fs = require('fs');
const path = require('path');
require('dotenv').config();

const env = {
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || 'playrushwaitlist.firebaseapp.com',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'playrushwaitlist',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || 'playrushwaitlist.firebasestorage.app',
  FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || '422630877273',
  FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || '1:422630877273:web:c2dff6d221dbf823cd6948',
  FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || 'G-2827Y2L1T7'
};

if (!env.FIREBASE_API_KEY) {
  throw new Error('FIREBASE_API_KEY is missing. Set it in Vercel environment variables or .env file.');
}

let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
Object.keys(env).forEach(key => {
  html = html.replace(`'ENV_${key}'`, `'${env[key] || ''}'`);
});
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);
fs.copyFileSync(path.join(__dirname, 'firebase.js'), path.join(__dirname, 'dist/firebase.js'));
fs.copyFileSync(path.join(__dirname, 'script.js'), path.join(__dirname, 'dist/script.js'));
fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(__dirname, 'dist/style.css'));

const assetsDir = path.join(__dirname, 'assets');
const distAssetsDir = path.join(__dirname, 'dist/assets');
fs.mkdirSync(distAssetsDir, { recursive: true });
fs.readdirSync(assetsDir).forEach(file => {
  fs.copyFileSync(path.join(assetsDir, file), path.join(distAssetsDir, file));
});