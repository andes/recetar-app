const http = require('http');
const fs = require('fs');
const path = require('path');

const users = [
    {
        identifier: 'profesional_test',
        password: 'password123',
        filename: 'token.json',
        label: 'PROFESIONAL'
    },
    {
        identifier: 'farmacia_test',
        password: 'password123',
        filename: 'token-farmacia.json',
        label: 'FARMACIA'
    }
];

async function login(user) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            identifier: user.identifier,
            password: user.password
        });

        const options = {
            hostname: '127.0.0.1',
            port: 4000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const tokenPath = path.join(__dirname, '..', 'data', user.filename);
                    fs.writeFileSync(tokenPath, body);
                    console.log(`TOKEN_${user.label}_SAVED`);
                    resolve();
                } else {
                    console.error(`FAILED ${user.label}: ${res.statusCode} - ${body}`);
                    reject(new Error(`Login failed for ${user.label}`));
                }
            });
        });

        req.on('error', (e) => {
            console.error(`ERROR ${user.label}: ${e.message}`);
            reject(e);
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('--- INICIANDO PROCESO DE AUTENTICACION PARA TESTS ---');
    try {
        for (const user of users) {
            await login(user);
        }
        console.log('--- AUTENTICACION COMPLETADA ---');
    } catch (err) {
        process.exit(1);
    }
}

run();
