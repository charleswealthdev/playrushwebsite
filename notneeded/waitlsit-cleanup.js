const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const { DateTime } = require('luxon');

const inputFile = 'playrush_waitlister.csv';
const outputFile = 'playrush_waitlister_cleaned.csv';

// Read and parse CSV
const records = [];

fs.createReadStream(inputFile)
  .pipe(parse({ columns: true, trim: true }))
  .on('data', (row) => {
    records.push({
      email: row.email,
      timestamp: row.timestamp,
    });
  })
  .on('end', () => {
    console.log(`Read ${records.length} entries`);

    // Remove duplicates (keep earliest timestamp)
    const emailMap = new Map();
    records.forEach((row) => {
      const email = row.email;
      const currentTimestamp = DateTime.fromISO(row.timestamp);
      if (!emailMap.has(email) || currentTimestamp < DateTime.fromISO(emailMap.get(email).timestamp)) {
        emailMap.set(email, row);
      }
    });

    const uniqueRecords = Array.from(emailMap.values());

    // Convert timestamps to YYYY-MM-DD HH:mm:ss
    const formattedRecords = uniqueRecords.map((row) => ({
      email: row.email,
      timestamp: DateTime.fromISO(row.timestamp).toFormat('yyyy-MM-dd HH:mm:ss'),
    }));

    console.log(`Processed ${formattedRecords.length} unique entries`);

    // Write to output CSV
    stringify(formattedRecords, { header: true }, (err, output) => {
      if (err) {
        console.error('Error writing CSV:', err);
        return;
      }
      fs.writeFileSync(outputFile, output);
      console.log(`Saved cleaned CSV to ${outputFile}`);
    });
  })
  .on('error', (err) => {
    console.error('Error reading CSV:', err);
  });