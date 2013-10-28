"use strict";

var loader = require("./definitionLoader");
var processor = require("./diffProcessor");

exports.findDifferences = function (options) {
    loader.loadSqlFiles(options.left, options.right, function(sqlDefinitions) {

        var differences = sqlDefinitions.map(processor.loadSqlFiles);

        options.done(differences);
    });
};