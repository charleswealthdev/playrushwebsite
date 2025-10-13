const admin = require('firebase-admin');
const fs = require('fs');
const csv = require('csv-parser');

const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const collectionName = 'waitlist';
const csvFilePath = './playrush_waitlist_2025-10-09 (1).csv';

async function importData() {
  const data = [];
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      if (row.Email && row.Timestamp) {
        data.push({
          email: row.Email.toLowerCase().trim(),
          timestamp: row.Timestamp ? admin.firestore.Timestamp.fromDate(new Date(row.Timestamp)) : admin.firestore.FieldValue.serverTimestamp(),
          userAgent: ''  
        });
      }
    })
    .on('end', async () => {
      console.log(`Parsed ${data.length} entries`);
      let batch = db.batch();
      let count = 0;
      for (const entry of data) {
        const docRef = db.collection(collectionName).doc();
        batch.set(docRef, entry);
        count++;
        if (count === 500) {
          await batch.commit();
          batch = db.batch();
          count = 0;
        }
      }
      if (count > 0) await batch.commit();
      console.log('Import complete');
    });
}

importData();