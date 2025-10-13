const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const csvFilePath = './playrush_waitlist_2025-10-09 (1).csv';

async function setInitialCounter() {
  try {
    const data = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        if (row.Email && row.Timestamp) {
          data.push(row);
        }
      })
      .on('end', async () => {
        console.log(`Parsed ${data.length} valid entries`);
        const counterRef = db.collection('metadata').doc('counter');
        await counterRef.set({ count: data.length });
        console.log(`Set initial counter to ${data.length}`);
        process.exit(0);
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        process.exit(1);
      });
  } catch (error) {
    console.error('Error setting counter:', error);
    process.exit(1);
  }
}

setInitialCounter();