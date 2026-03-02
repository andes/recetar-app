const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Helper para realizar peticiones HTTP
 */
async function request(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ body: parsed, statusCode: res.statusCode });
                } catch (e) {
                    resolve({ body: body, statusCode: res.statusCode });
                }
            });
        });
        req.on('error', (e) => reject(e));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function seed() {
    console.log('--- VERIFICANDO MEDICAMENTO DE PRUEBA VIA API ---');
    try {
        const tokenPath = path.join(__dirname, '..', 'data', 'token.json');
        if (!fs.existsSync(tokenPath)) {
            console.error('ERROR: No existe token.json en test/data/. Ejecuta primero auth.js');
            process.exit(1);
        }

        const tokenContent = fs.readFileSync(tokenPath, 'utf8');
        const tokenData = JSON.parse(tokenContent);
        const token = tokenData.jwt;

        if (!token) {
            console.error('ERROR: El token no es válido en token.json');
            process.exit(1);
        }

        // 1. Buscar si existe el medicamento
        const searchOptions = {
            hostname: '127.0.0.1',
            port: 4000,
            path: '/api/supplies?supplyName=Paracetamol%20500mg',
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };

        const searchRes = await request(searchOptions);

        // La API devuelve un array en /api/supplies?supplyName=...
        const existingSupplies = Array.isArray(searchRes.body) ? searchRes.body : [];
        const found = existingSupplies.find(s => s.name === 'Paracetamol 500mg');

        if (found) {
            console.log('EL MEDICAMENTO "Paracetamol 500mg" YA EXISTE EN LA API');
            process.exit(0);
        }

        // 2. Crear si no existe
        console.log('CREANDO MEDICAMENTO DE PRUEBA VIA API...');
        const createData = {
            name: 'Paracetamol 500mg',
            activePrinciple: 'Paracetamol',
            power: '500',
            unity: 'mg',
            pharmaceutical_form: 'Comprimido'
        };

        const createOptions = {
            hostname: '127.0.0.1',
            port: 4000,
            path: '/api/supplies',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };

        const createRes = await request(createOptions, createData);
        if (createRes.statusCode === 200 || createRes.statusCode === 201) {
            console.log('MEDICAMENTO CREADO EXITOSAMENTE VIA API');
        } else {
            console.error('ERROR AL CREAR MEDICAMENTO EN API:', createRes.statusCode, JSON.stringify(createRes.body));
            // No salimos con error 1 para permitir que los tests intenten correr
            // si el medicamento ya estaba pero no lo encontramos en la búsqueda (por regex p.ej)
        }
        process.exit(0);
    } catch (err) {
        console.error('ERROR CRITICO EN SEED-SUPPLY:', err.message);
        process.exit(1);
    }
}

seed();
