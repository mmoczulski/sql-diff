var path = require("path");
var fs = require("fs");

exports.findDifferences = function(leftFiles, rightFiles, done) {
    var leftFileNames = leftFiles.map(path.basename);
    var rightFileNames = rightFiles.map(path.basename);

    var differences = {};

    findDifferencesInFilesWithSameNames(differences, leftFiles, rightFiles);

    done(differences);
};

function findDifferencesInFilesWithSameNames(differences, leftFiles, rightFiles) {
    var leftFileNames = leftFiles.map(path.basename);
    var rightFileNames = rightFiles.map(path.basename);

    var commonFiles = readCommonFiles();

    var possibleDifferences = findDifferencesIn(commonFiles[1]);

    console.log("Let's start with analyse of possible differences");

    function readCommonFiles() {
        return leftFileNames.filter(function (fileName) {
            return rightFileNames.indexOf(fileName) !== -1;
        }).sort().map(toFileInfo.bind(null, leftFiles, rightFiles));
    }
}

function findDifferencesIn(commonFile) {
    var leftFile = readSqlDefinitionFrom(commonFile.left);
    var rightFile = readSqlDefinitionFrom(commonFile.right);

    var leftColumnNames = leftFile.columns.map(toColumnName);
    var rightColumnNames = rightFile.columns.map(toColumnName);

    var sameColumns = rightFile.columns.filter(function (column) {
        return leftColumnNames.indexOf(column.name) !== -1;
    }).map(function (column) {
            return {
                from: leftFile.columns[leftColumnNames.indexOf(column.name)],
                to: column
            };
        });
    var addedColumns = rightFile.columns.filter(function (column) {
        return leftColumnNames.indexOf(column.name) === -1;
    });
    var removedColumns = leftFile.columns.filter(function (column) {
        return rightColumnNames.indexOf(column.name) === -1;
    });

    var changedColumns = tryFindChangedNamesIn(addedColumns, removedColumns);

    return {
        oldTableName: leftFile.name,
        newTableName: rightFile.name,
        addedColumns: addedColumns,
        removedColumns: removedColumns,
        columnsWithSameNames: sameColumns,
        columnsWithChangedNames: changedColumns
    };
}

function toColumnName(column) {
    return column.name;
}

function tryFindChangedNamesIn(addedColumns, removedColumns) {
    var changed = [];
    var addedColumnNames = addedColumns.map(toColumnName);
    var removedColumnNames = removedColumns.map(toColumnName);

    findChangedNames(haveChangedPrefixesOrSuffixes);
    findChangedNames(areSimilar);

    return changed;

    function findChangedNames(comparator) {
        var duplicates = [];
        addedColumnNames.forEach(function(addedColumnName) {
            removedColumnNames.forEach(function(removedColumnName) {
                if (comparator(addedColumnName, removedColumnName)) {
                    var duplicate = {
                        from: removedColumns.filter(function (column) {
                            return column.name === removedColumnName;
                        })[0],
                        to: addedColumns.filter(function (column) {
                            return column.name === addedColumnName;
                        })[0]
                    };
                    changed.push(duplicate);
                    duplicates.push(duplicate);
                }
            });
        });
        removeDuplicates(duplicates);
    }

    function removeDuplicates(duplicates) {
        duplicates.forEach(function (duplicate) {
            addedColumns.splice(addedColumns.indexOf(duplicate.to), 1);
            addedColumnNames.splice(addedColumnNames.indexOf(duplicate.to.name), 1);
            removedColumns.splice(removedColumns.indexOf(duplicate.from), 1);
            removedColumnNames.splice(removedColumnNames.indexOf(duplicate.from.name), 1);
        });
    }
}

function haveChangedPrefixesOrSuffixes(addedColumnName, removedColumnName) {
    return addedColumnName.indexOf(removedColumnName) !== -1 ||
        removedColumnName.indexOf(addedColumnName) !== -1;
}

function areSimilar(addedColumnName, removedColumnName) {
    var added = addedColumnName.split("_");
    var removed = removedColumnName.split("_");
    var count = 0;

    added.forEach(function(a) {
        removed.forEach(function(b) {
            if (a === b) {
                ++count;
            }
        });
    });

    return count > 2;
}

var TABLE_DEFINITION = /CREATE\s+TABLE\s+([\w."]+)\s+\(\s+/i;
var END_TABLE_DEFINITION = /\);/i;
var COLUMN_DEFINITION = /(\w+)\s+(\w+\s*(\([^)]+\))?)\s+(?:(UNIQUE)\s+)?(?:(?:NOT\s+)?NULL\s+)?(?:(IDENTITY\(1,1\))\s+)?(?:(PRIMARY\s+KEY\s+))?/gi;
// \((.*(?=\);))\);

function readSqlDefinitionFrom(fileName) {
    var sql = fs.readFileSync(fileName).toString();

    var e = TABLE_DEFINITION.exec(sql);

    if (!e) {
        return null;
    } else {
        var table = {
            name: tableName(e[1])
        };

        var columns = sql.substr(e.index + e[0].length);
        var f = END_TABLE_DEFINITION.exec(columns);

        if (f) {
            table.columns = readColumns(columns.substring(0, f.index));
        }

        return table;
    }
}

function tableName(nameWithSchema) {
    if (nameWithSchema.indexOf(".") === -1) {
        return nameWithSchema;
    }
    return nameWithSchema.substring(nameWithSchema.lastIndexOf(".") + 1);
}

function readColumns(sql) {
    var columns = [];
    var parenthesisDeep = 0;
    var lastIndex = 0;
    var c;

    for (var i = 0; i < sql.length; i++) {
        c = sql.charAt(i);
        if (c === "," && parenthesisDeep === 0) {
            columns.push(parseColumn(sql.substring(lastIndex, i)));
            lastIndex = i;
        } else if (c === "(") {
            parenthesisDeep++;
        } else if (c === ")") {
            parenthesisDeep--;
        }
    }

    return columns;
}

function parseColumn(column) {
    // just read the column definition - without white characters or comma before the actual name of column
    var columnDefinition = column.substring(/\w/i.exec(column).index);
    var d = columnDefinition.split(/\s+/i);
    return {
        name: d[0],
        type: d[1],
        mandatory: /(NOT\s+NULL)|(PRIMARY\s+KEY)/i.test(columnDefinition),
        columnDefinition: columnDefinition
    };
}

function toFileInfo(leftFiles, rightFiles, fileName) {
    var byName = filterByName.bind(null, fileName);
    return {
        fileName: fileName,
        left: leftFiles.filter(byName)[0],
        right: rightFiles.filter(byName)[0]
    };
}

function filterByName(fileName, filePath) {
    return path.basename(filePath) === fileName;
}