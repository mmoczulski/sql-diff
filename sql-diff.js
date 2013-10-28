"use strict";

var fs = require("fs");
var async = require("async");
var path = require("path");
var args = require("optimist").
    usage("Usage: $0 --output [path] --left [path] --right [path]").
    demand(["left", "right", "output"]).
    describe("left", "Left folder (earlier one) to compare").
    describe("right", "Right folder (later one) to compare").
    describe("output", "The name of file, to which report will be generated").
    argv;


var leftDir = args.left;
var rightDir = args.right;

var diff = require("./lib/diff");


if (leftDir === rightDir) {
    console.error("Cannot compare two same directories!");
    process.exit(-1);
}

async.each([leftDir, rightDir], directoryExists, function(err) {
    if (err) {
        console.error("The provided directory does not exists", err);
        process.exit(-1);
    }

    async.map([leftDir, rightDir], readDir, function(err, directories) {
        if (err) {
            console.error("Cannot read directory", err);
            process.exit(-1);
        }

        var leftDirectory = directories[0];
        var rightDirectory = directories[1];

        diff.findDifferences({
            left: leftDirectory,
            right: rightDirectory,
            output: args.output,
            done: function () {
                console.log("Job finished successfully");
            }
        });
    });
});

function directoryExists(dirPath, done) {
    fs.exists(dirPath, function (exists) {
        if (exists) {
            fs.stat(dirPath, function(err, stats) {
                if (err) {
                    done(err);
                    return;
                }
                if (stats.isDirectory()) {
                    done();
                } else {
                    done("Is not a directory: " + dirPath);
                }
            });
        } else {
            done("Not exist: " + dirPath);
        }
    });
}

function readDir(directory, done) {
    fs.readdir(directory, function(err, content) {
        if (err) {
            done(err, null);
            return;
        }

        done(null, content.map(function (file) {
            return directory + path.sep + file;
        }));
    });
}