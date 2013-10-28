"use strict";

var constants = require("./constants");

exports.processRenamedColumns = function(sqlDefinition, renamingDictionary) {
    var potentialRenamings = Object.keys(renamingDictionary);
    var columnsWithChangesNames = [];
    var addedColumnNames = sqlDefinition.addedColumns.map(function (column) {
        return column.name;
    });
    var removedColumnNames = sqlDefinition.removedColumns.map(function (column) {
        return column.name;
    });

    addedColumnNames.forEach(function(addedColumnName) {
        removedColumnNames.forEach(function(removedColumnName) {
            if (potentialRenamings.indexOf(removedColumnName) !== -1 &&
                renamingDictionary[removedColumnName] === addedColumnName) {

                columnsWithChangesNames.push({
                    from: sqlDefinition.removedColumns.filter(function (column) {
                        return column.name === removedColumnName;
                    })[0],
                    to: sqlDefinition.addedColumns.filter(function (column) {
                        return column.name === addedColumnName;
                    })[0]
                });
            }
        });
    });

    columnsWithChangesNames.forEach(function (duplicate) {
        sqlDefinition.addedColumns.splice(sqlDefinition.addedColumns.indexOf(duplicate.to), 1);
        addedColumnNames.splice(addedColumnNames.indexOf(duplicate.to.name), 1);
        sqlDefinition.removedColumns.splice(sqlDefinition.removedColumns.indexOf(duplicate.from), 1);
        removedColumnNames.splice(removedColumnNames.indexOf(duplicate.from.name), 1);
    });

    sqlDefinition.columnsWithSameNames = sqlDefinition.columnsWithSameNames.concat(columnsWithChangesNames);
};

exports.processSqlDefinitions = function(sqlDefinition) {
    var diff = [];
    diff.tableName = sqlDefinition.newTableName;

    if (sqlDefinition.newTableName !== sqlDefinition.oldTableName) {
        diff.push({
            type: constants.CHANGED_TABLE_NAME,
            from: sqlDefinition.oldTableName,
            to: sqlDefinition.newTableName
        });
    }

    sqlDefinition.addedColumns.forEach(function (addedColumn) {
        diff.push({
            type: constants.ADDED_COLUMN,
            definition: addedColumn.columnDefinition,
            name: addedColumn.name
        });
    });
    sqlDefinition.removedColumns.forEach(function (removedColumn) {
        diff.push({
            type: constants.REMOVED_COLUMN,
            name: removedColumn.name
        });
    });

    sqlDefinition.columnsWithSameNames.forEach(function (changedColumn) {
        if (changedColumn.from.name !== changedColumn.to.name) {
            diff.push({
                type: constants.CHANGED_COLUMN_NAME,
                name: changedColumn.to.name,
                from: changedColumn.from.name
            });
        }
        if (changedColumn.from.type !== changedColumn.to.type) {
            diff.push({
                type: constants.CHANGED_COLUMN_TYPE,
                name: changedColumn.to.name,
                from: changedColumn.from.type,
                to: changedColumn.to.type
            });
        }
        if (changedColumn.from.mandatory !== changedColumn.to.mandatory) {
            diff.push({
                type: constants.CHANGED_COLUMN_OBLIGATION,
                name: changedColumn.to.name,
                from: changedColumn.from.mandatory,
                to: changedColumn.to.mandatory
            });
        }
    });

    return diff;
};