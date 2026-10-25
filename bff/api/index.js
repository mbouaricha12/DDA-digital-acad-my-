'use strict';

// Vercel serverless entry point. A Node.js function here is just a (req, res)
// handler — Vercel calls this directly per request, it never calls .listen()
// itself (that stays local-dev-only, in src/server.js). vercel.json routes
// every path under this BFF's deployment to this one file.
const { buildHandler } = require('../src/handler');

// Built once per cold start and reused across warm invocations of the same
// function instance — same pattern as any serverless Node handler reusing a
// DB client. configFromEnv/validateRuntimeConfig fail fast with a clear
// error if required env vars are missing; surfaced as 503 rather than
// crashing the function on every request, since that misconfiguration is
// usually something a deploy owner fixes by setting env vars and redeploying,
// not something a client's own request can retry past.
let handlerPromise;
function getHandler() {
  if (!handlerPromise) {
    handlerPromise = Promise.resolve().then(() => buildHandler(process.env));
  }
  return handlerPromise;
}

module.exports = async function (req, res) {
  let handler;
  try {
    handler = await getHandler();
  } catch (error) {
    handlerPromise = null; // let the next request retry instead of caching a startup failure forever
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'bff_misconfigured' }));
    return;
  }
  return handler(req, res);
};
