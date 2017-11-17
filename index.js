// We use serverless framework to manage our Lambda and API Gateway deployments on AWS
const serverless = require('serverless-http');

// We use standard Express.js framework for web applications.
const express = require('express');
const swof = express();

swof.get('/', function (req, res) {
    res.send('Hello from Support Wheel of Fate!')
});

// We wrap the app in serverless-http for use in API Gateway
module.exports.handler = serverless(swof);