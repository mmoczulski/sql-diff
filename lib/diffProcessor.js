"use strict";

var constants = require("./constants");

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
    sqlDefinition.columnsWithChangedNames.forEach(function (changedColumn) {
        diff.push({
            type: constants.CHANGED_COLUMN_NAME,
            name: changedColumn.to.name,
            from: changedColumn.from.name
        });

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

    sqlDefinition.columnsWithSameNames.forEach(function (changedColumn) {
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