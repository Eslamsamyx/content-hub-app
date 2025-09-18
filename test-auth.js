#!/usr/bin/env node

const http = require('http');

const postData = JSON.stringify({
  email: 'admin@contenthub.com',
  password: 'Test@123'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed response:', parsed);
    } catch (e) {
      console.log('Could not parse response as JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();