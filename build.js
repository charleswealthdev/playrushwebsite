const fs = require('fs');
     const path = require('path');

     const env = {
       FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
       FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
       FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
       FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
       FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
       FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
       FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID
     };

     let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
     Object.keys(env).forEach(key => {
       html = html.replace(`'${key}'`, `'${env[key]}'`);
     });
     fs.writeFileSync(path.join(__dirname, 'dist/index.html'), html);