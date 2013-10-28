"use strict";

var HEADER = "Table,Column,Before,After,Changes";
var fs = require("fs");
var os = require("os");
var constants = require("./constants");
var format = require("util").format;

var LABELS = {};
var DIFF_WRITERS = {};


LABELS[constants.ADDED_COLUMN] = "Added";
DIFF_WRITERS[constants.ADDED_COLUMN] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,,,%s", tableName, difference.definition,
        LABELS[constants.ADDED_COLUMN]));
};

LABELS[constants.ADDED_TABLE] = "Table added";
DIFF_WRITERS[constants.ADDED_TABLE] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,,,%s", difference.name, difference.name, LABELS[constants.ADDED_TABLE]));
};

LABELS[constants.CHANGED_COLUMN_NAME] = "Name";
DIFF_WRITERS[constants.CHANGED_COLUMN_NAME] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,%s,,%s", tableName, difference.to, difference.from,
        LABELS[constants.CHANGED_COLUMN_NAME]));
};

LABELS[constants.CHANGED_COLUMN_OBLIGATION] = "Essentiality type";
DIFF_WRITERS[constants.CHANGED_COLUMN_OBLIGATION] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,%s,%s,%s", tableName, difference.name, nullability(difference.from),
        nullability(difference.to), LABELS[constants.CHANGED_COLUMN_OBLIGATION]));
};
function nullability(isMandatory) {
    return isMandatory ? "NOT NULL" : "NULL";
}

LABELS[constants.CHANGED_COLUMN_TYPE] = "Data type";
DIFF_WRITERS[constants.CHANGED_COLUMN_TYPE] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,%s,%s,%s", tableName, difference.name, difference.from, difference.to,
        LABELS[constants.CHANGED_COLUMN_TYPE]));
};

LABELS[constants.REMOVED_COLUMN] = "Removed";
DIFF_WRITERS[constants.REMOVED_COLUMN] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,,,%s", tableName, difference.name, LABELS[constants.REMOVED_COLUMN]));
};

LABELS[constants.REMOVED_TABLE] = "Table removed";
DIFF_WRITERS[constants.REMOVED_TABLE] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,,,%s", difference.name, difference.name, LABELS[constants.REMOVED_TABLE]));
};

LABELS[constants.CHANGED_TABLE_NAME] = "Table renamed";
DIFF_WRITERS[constants.CHANGED_TABLE_NAME] = function (stream, tableName, difference) {
    stream.write(format("%s,%s,%s,,%s", tableName, difference.to, difference.from,
        LABELS[constants.CHANGED_TABLE_NAME]));
};

exports.generate = function (differences, fileName, done) {

    var stream = fs.createWriteStream(fileName);

    stream.write(HEADER + os.EOL);

    differences.forEach(function (differencesInTable) {
        differencesInTable.forEach(function (difference) {
            DIFF_WRITERS[difference.type](stream, differencesInTable.tableName, difference);
            stream.write(os.EOL);
        });
    });
    stream.end();

    done(null);
};