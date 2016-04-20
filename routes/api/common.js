var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');
var mongoose = require('mongoose');

var config = require('../../lib/config');
var service = require('../../lib/service');
var CommonError = require('../../lib/error').CommonError;
var ResponseError = require('../../lib/error').ResponseError;

var VisitorModel = require('../../lib/models/visitor')(mongoose);
var RegisterHistoryModel = require('../../lib/models/register_history')(mongoose);
var VisitHistoryModel = require('../../lib/models/visit_history')(mongoose);
var PlaceModel = require('../../lib/models/place')(mongoose);

router.post('/upload', function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        var result = {};
        for (var file_k in files) {
            result[file_k] = [];
            for (var file_i = 0; file_i < files[file_k].length; file_i++) {
                var fileObj = files[file_k][file_i];
                var savePath = _cpfile(fileObj);
                result[file_k].push(savePath);
            }
        }
        res.send(new ResponseError(0, "success", result));
    });
});

module.exports = router;

/**
 * save the uploaded image
 * @param  {file object} fileObj file object
 * @return {string}              the saved file name
 */
function _cpfile(fileObj) {
    var saveDir = path.join(__dirname, '../../public/');
    if (!(fs.existsSync(saveDir) && fs.statSync(saveDir).isDirectory())) fs.mkdirSync(saveDir);
    saveDir = path.join(saveDir, 'uploads/');
    if (!(fs.existsSync(saveDir) && fs.statSync(saveDir).isDirectory())) fs.mkdirSync(saveDir);
    var fileExd = fileObj.originalFilename.match(/^.*\.([a-zA-Z]+)$/)[1];
    // fs.renameSync(fileObj.path, savePath);
    imagePath = uuid.v1() + '.' + fileExd;
    var savePath = path.join(saveDir, imagePath);
    fileCopy(fileObj.path, savePath);
    return imagePath;
}














