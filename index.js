"use strict";

// We use serverless framework to manage our Lambda and API Gateway deployments on AWS
const serverless = require("serverless-http");

// We use standard Express.js framework for web applications.
const express = require("express");
const swof = express();
const bodyParser = require("body-parser");
swof.use(bodyParser.json({strict: false}));

// Seedable PRNG random generator
const seedrandom = require("seedrandom");

// AWS SDK and DynamoDB support
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ENGINEERS_TABLE = process.env.ENGINEERS_TABLE;

// Returns two developers doing BAU in given day
swof.get("/bau/:date", function (req, res) {
    // Hardcoded list of engineers for now.
    // Get from Dynamo DB
    let engineers = [
        "John J.",
        "Adam A.",
        "Jane J.",
        "Robert R.",
        "Warren W.",
        "Eva W.",
        "Melanie M.",
        "Karl K.",
        "Olaf O.",
        "Igor I."
    ];
    let teamSize = engineers.length;

    // Calculate current period, current day and day of a period.
    // Periods and days are calculated starting from UNIX TIME.
    let date = new Date(req.params.date);

    // Validate if format of a date is correct
    // This is simple validation, in the future we may want something
    // forcing much more defined date format as input.
    if (Number.isNaN(date)) {
        res.send(403, "Bad date format");
        return;
    }

    let period = Math.floor(date.getTime() / (86400000 * teamSize));
    let day = date.getTime() / 86400000;
    let periodDay = day % teamSize;

    // Seed the random generator using the current period
    // and then shuffle the engineer list using modern Fisher-Yates algorithm.
    // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
    // Seeding the random number generator allows us to have the random results predictable in time.
    const rng = seedrandom(period);
    for (let i = engineers.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [engineers[i], engineers[j]] = [engineers[j], engineers[i]];
    }

    // Calculate the day from the UNIX EPOCH
    res.json(engineers);
});

// We wrap the app in serverless-http for use in API Gateway
module.exports.handler = serverless(swof);