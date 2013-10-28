"use strict";

var loader = require("./definitionLoader");
var processor = require("./diffProcessor");
var reporter = require("./csvReport");

exports.findDifferences = function (options) {
    loader.loadSqlFiles(options.left, options.right, function(sqlDefinitions) {

        var differences = sqlDefinitions.map(processor.processSqlDefinitions);

        reporter.generate(differences, options.output, function (err) {
            if (err) {
                console.error("An error occurred during generation of report", err);
                process.exit(-1);
            }

            options.done();
        });
    });
};