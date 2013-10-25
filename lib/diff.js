var path = require("path");

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

    console.log("common:", commonFiles);

    commonFiles.forEach(function (fileName) {

    });

    function readCommonFiles() {
        return leftFileNames.filter(function (fileName) {
            return rightFileNames.indexOf(fileName) !== -1;
        }).sort().map(toFileInfo.bind(null, leftFiles, rightFiles));
    }
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