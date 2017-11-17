"use strict";

// We use serverless framework to manage our Lambda and API Gateway deployments on AWS
const serverless = require("serverless-http");

const bodyParser = require("body-parser");

const AWS = require("aws-sdk");

// We use standard Express.js framework for web applications.
const express = require("express");
const swof = express();
swof.use(bodyParser.json({strict: false}));

const DEVELOPERS_TABLE = process.env.DEVELOPERS_TABLE;
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Returns two developers doing BAU in given day
swof.get("/bau/:date", function (req, res) {
    res.send("BAU for " + req.params.date + " stub.");
});

// We wrap the app in serverless-http for use in API Gateway
module.exports.handler = serverless(swof);