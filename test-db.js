const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'adani-excel.db');
console.log('Opening DB at:', dbPath);

try {
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening DB:', err);
        } else {
            console.log('DB opened successfully');
            db.get('SELECT 1', (err, row) => {
                if (err) {
                    console.error('Error running query:', err);
                } else {
                    console.log('Query result:', row);
                }
            });
        }
    });
} catch (e) {
    console.error('Exception:', e);
}
