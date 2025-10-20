const fs = require('fs');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');
const { DateTime } = require('luxon');
const { v4: uuidv4 } = require('uuid');

const inputFile = 'playrushwaitlister.csv';
const outputFile = 'playrush_waitlister_cleaned.csv';
const errorFile = 'playrush_waitlister_errors.csv';

const records = [];
const invalidRows = [];

fs.createReadStream(inputFile)
  .pipe(parse({ columns: true, trim: true }))
  .on('data', (row) => {
    const normalizedRow = {
      email: row.email || row.Email || row._0,
      timestamp: row.timestamp || row.Timestamp || row._1,
      id: row.ID || row.id || row._2 || uuidv4(), // Generate UUID if missing
      user_agent: row.user_agent || row.UserAgent || row._3 || ''
    };

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedRow.email || !emailRegex.test(normalizedRow.email)) {
      console.log(`Skipping row with invalid or missing email: ${JSON.stringify(row)}`);
      invalidRows.push({ ...row, error: 'Invalid or missing email' });
      return;
    }

    // Validate timestamp
    if (!normalizedRow.timestamp || !DateTime.fromISO(normalizedRow.timestamp).isValid) {
      console.log(`Skipping row with invalid or missing timestamp: ${JSON.stringify(row)}`);
      invalidRows.push({ ...row, error: 'Invalid or missing timestamp' });
      return;
    }

    // Validate UUID
    if (!normalizedRow.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      normalizedRow.id = uuidv4();
    }

    records.push(normalizedRow);
  })
  .on('end', () => {
    console.log(`Read ${records.length} valid entries`);

    // Save invalid rows
    if (invalidRows.length > 0) {
      stringify(invalidRows, { header: true }, (err, output) => {
        if (err) {
          console.error('Error writing error CSV:', err);
          return;
        }
        fs.writeFileSync(errorFile, output);
        console.log(`Saved ${invalidRows.length} invalid rows to ${errorFile}`);
      });
    }

    // Remove duplicates, keeping the latest timestamp
    const emailMap = new Map();
    records.forEach((row) => {
      const email = row.email.toLowerCase();
      const currentTimestamp = DateTime.fromISO(row.timestamp);
      if (!emailMap.has(email) || currentTimestamp > DateTime.fromISO(emailMap.get(email).timestamp)) {
        emailMap.set(email, row);
      }
    });

    const uniqueRecords = Array.from(emailMap.values());

    // Format for Supabase compatibility
    const formattedRecords = uniqueRecords.map((row) => ({
      email: row.email,
      timestamp: DateTime.fromISO(row.timestamp).toFormat('yyyy-MM-dd HH:mm:ss'),
      id: row.id,
      user_agent: row.user_agent
    }));

    console.log(`Processed ${formattedRecords.length} unique entries`);

    // Save cleaned CSV
    stringify(formattedRecords, { header: true, columns: ['email', 'timestamp', 'id', 'user_agent'] }, (err, output) => {
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