const http = require('http');

function checkUrl(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`URL: ${url}`);
                console.log(`Status: ${res.statusCode}`);
                console.log(`Body: ${data.substring(0, 200)}...`);
                resolve();
            });
        }).on('error', (err) => {
            console.error(`Error fetching ${url}:`, err.message);
            reject(err);
        });
    });
}

async function verify() {
    try {
        console.log('Verifying /api/health...');
        await checkUrl('http://localhost:3000/api/health');

        console.log('\nVerifying /api/backup-data?fiscalYear=FY_25...');
        await checkUrl('http://localhost:3000/api/backup-data?fiscalYear=FY_25');
    } catch (e) {
        console.error('Verification failed:', e);
        process.exit(1);
    }
}

setTimeout(verify, 2000); // Wait for server to start
