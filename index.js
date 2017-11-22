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
const dynamoDb = new AWS.DynamoDB();

// The modern version of the Fisher–Yates shuffle algorithm
// https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm
function shuffle(seed, array) {
    const rng = seedrandom(seed);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

// CORS support
swof.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Returns two engineers doing BAU in a given day
swof.get("/baus/:date", function (req, res) {
    dynamoDb.scan({
        TableName: process.env.ENGINEERS_TABLE,
        Limit: 20
    }, function(err, data) {
        if (err) {
            res.send(500, "Unable to fetch data from DynamoDB " + err);

        } else {
            let engineers = [];
            data.Items.forEach(function(element, index, array) {
                engineers.push({id: element.id.S, name: element.name.S});
            });

            // TODO: Check if we have enough engineers to accommodate 'nonconsecutive' use case
            // TODO: Check if we have too many engineers to accommodate 'full day over two weeks' requirement

            const teamSize = engineers.length;
            const bauLength = 43200000; // In milliseconds - currently half a day

            // Calculate current period, current bau and bau of a period.
            // Periods and baus are calculated starting from UNIX TIME (1970-01-01T00:00:00).
            let date = new Date(req.params.date);
            let period = Math.floor(date.getTime() / (bauLength * teamSize));
            let bau = date.getTime() / bauLength;
            let periodBau = bau % teamSize;
            if (Number.isNaN(period)) {
                res.send(403, "Bad date format");
                return;
            }

            // First shuffle the whole engineers table to add entropy
            // We use length of the list as the seed, so that the resulting
            // random order is always the same for each list.
            shuffle(engineers.length, engineers);

            // Divide into two teams. Division enables us to avoid
            // consecutive days for the same person on the 'seams' of the periods
            const teams = [engineers.slice(0, Math.floor(engineers.length / 2)), engineers.slice(Math.floor(engineers.length / 2))];

            // Shuffle each team using period as the seed.
            // We use seed to make sure we've got repeatable results and the distribution is uniform.
            for (let i in teams) {
                shuffle(period, teams[i]);
            }

            // Join both teams into one seamless period
            const seamless = teams[0].concat(teams[1]);

            // Send the results back to the client
            res.json({
                "engineers": engineers,
                "baus": [seamless[periodBau]["id"], seamless[periodBau + 1]["id"]]
            });
        }
    });

});

// We wrap the app in serverless-http for use in API Gateway
module.exports.handler = serverless(swof);