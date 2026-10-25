'use strict';

const http = require('node:http');
const { buildHandler } = require('./handler');
const { configFromEnv } = require('./app');

let handler;
try {
  handler = buildHandler(process.env);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const config = configFromEnv();
http.createServer(handler).listen(config.port, '0.0.0.0', () => {
  console.log(`DDA BFF listening on http://0.0.0.0:${config.port}`);
});
