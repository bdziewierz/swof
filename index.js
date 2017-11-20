"use strict";

// We use serverless framework to manage our Lambda and API Gateway deployments on AWS
const serverless = require("serverless-http");

// We use standard Express.js framework for web applications.
const express = require("express");
const swof = express();

// Seedable PRNG random generator
const seedrandom = require("seedrandom");

// AWS SDK and DynamoDB support
const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const ENGINEERS_TABLE = process.env.ENGINEERS_TABLE;

// Hardcoded list of engineers for now.
// Get from Dynamo DB
const engineers = [
    "Anna B.",
    "Lisa R.",
    "Adam V.",
    "Luis C.",
    "Olaf I.",
    "Robert T.",
    "Warren H.",
    "Nadia U.",
    "Peter R."
];

// Return all available engineers
swof.get("/engineers", function (req, res) {
    // Send the results back to the client
    // res.json([period, bau, periodBau, seamless[teamSize + periodBau], seamless[teamSize + periodBau + 1], seamless]);
    res.json(engineers);
});

// Returns two engineers doing BAU in given day
swof.get("/bau/:date", function (req, res) {
    const teamSize = engineers.length;
    const bauLength = 43200000; // In milliseconds - currently half a day

    // Calculate current period, current bau and bau of a period.
    // Periods and baus are calculated starting from UNIX TIME (1970-01-01T00:00:00).
    let date = new Date(req.params.date);
    if (Number.isNaN(date)) {
        res.send(403, "Bad date format");
        return;
    }
    let period = Math.floor(date.getTime() / (bauLength * teamSize));
    let bau = date.getTime() / bauLength;
    let periodBau = bau % teamSize;

    // Create 3 adjacent shuffles of the engineers list, to make sure we've got seams covered and no
    // engineer will have repeated BAU on the seam of a period.
    // We bascially shuffle three copies of engineer list using adjacent period offsets as seed data,
    // concat them and them make sure we've got no engineers doing double BAUS on seams.
    const adjacentPeriods = [engineers.slice(), engineers.slice(), engineers.slice()];
    let periodOffset = -1
    for (let p in adjacentPeriods) {

        // Seed the random generator using the current period
        // and then shuffle the engineer list using modern Fisher-Yates algorithm.
        // https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
        // Seeding the random number generator allows us to have the random results predictable in time.
        const rng = seedrandom(period + periodOffset);
        for (let i = adjacentPeriods[p].length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [adjacentPeriods[p][i], adjacentPeriods[p][j]] = [adjacentPeriods[p][j], adjacentPeriods[p][i]];
        }
        periodOffset++;
    }

    // Join shuffled copies of periods and merge them into seamless array
    var seamless = adjacentPeriods[0].concat(adjacentPeriods[1]).concat(adjacentPeriods[2]);

    // TODO: Confirm we have no repeats on the seams.


    // Send the results back to the client
    // res.json([period, bau, periodBau, seamless[teamSize + periodBau], seamless[teamSize + periodBau + 1], seamless]);
    res.json([seamless[teamSize + periodBau], seamless[teamSize + periodBau + 1]]);
});

// We wrap the app in serverless-http for use in API Gateway
module.exports.handler = serverless(swof);