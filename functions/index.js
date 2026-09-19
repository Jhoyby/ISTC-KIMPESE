const functions = require('firebase-functions');
const app = require('../server.js');
module.exports.api = functions.onRequest(app, {cors: true});
