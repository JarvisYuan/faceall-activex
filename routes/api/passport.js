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

router.post('/register', function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        if (!(fields.cid && fields.cid[0]
                && fields.name && fields.cid[0]
                && fields.placeid && fields.cid[0]
                && fields.photo_feature && fields.photo_feature[0]
                && fields.portrait_feature && fields.portrait_feature[0]
                && fields.photo_imgpath && fields.photo_imgpath[0]
                && fields.portrait_imgpath && fields.portrait_imgpath[0])) {
            res.sendStatus(400);
            return;
        }
        var cid = fields.cid[0];
        var name = fields.name[0];
        var placeid = fields.placeid[0];
        var photo_feature = null;
        var portrait_feature = null;
        try {
            photo_feature = JSON.parse(fields.photo_feature[0]);
            portrait_feature = JSON.parse(fields.portrait_feature[0]);
        } catch (e) {}
        if (!(photo_feature && portrait_feature)) {
            res.sendStatus(400);
            return;
        }
        var today = new Date();
        VisitorModel.findOne({
            "cid": cid
        }, {}, function(err, visitor) {
            if (err) {
                new CommonError("An error occured when register", {error: err}).print();
                res.sendStatus(500);
            } else {
                var visitorUpdated = true;
                var today = new Date();
                if (visitor && today.getTime() >= visitor.validPeriod.start && today.getTime() < visitor.validPeriod.end) {
                    res.send(new ResponseError(1003));
                } else {
                    PlaceModel.findOne({ _id: placeid }, {}, function(err, place) {
                        if (err) {
                            new CommonError("An error occured when register", err).print();
                            res.sendStatus(500);
                        } else {
                            if (place) {
                                // photo: the photo taken by camera
                                // portrait: the photo on the id-card
                                if (place.roles.indexOf('o2o') >= 0) {
                                    if (service.verifyFace(portrait_feature, photo_feature)) {
                                        var photoPath = fields.photo_imgpath[0];
                                        var portraitPath = fields.portrait_imgpath[0];
                                        if (visitor) {
                                            visitor.validPeriod.start = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()).getTime();
                                            visitor.validPeriod.end = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1).getTime();
                                            visitor.markModified('validPeriod');
                                            visitor.name = name;
                                            visitor.face = {
                                                feature: portrait_feature,
                                                imagePath: portraitPath
                                            };
                                        } else {
                                            visitor = new VisitorModel({
                                                cid: cid,
                                                name: name,
                                                face: {
                                                    feature: portrait_feature,
                                                    imagePath: portraitPath
                                                }
                                            });
                                        }
                                        visitor.save(function(err) {
                                            if (err) {
                                                new CommonError("An error occured when register", {error: err}).print();
                                                res.sendStatus(500);
                                            } else {
                                                res.send(ResponseError.SUCCESS);
                                                var registerHistory = new RegisterHistoryModel({
                                                    visitorId: visitor._id,
                                                    placeId: place._id,
                                                    imagePath: portraitPath,
                                                });
                                                registerHistory.save();
                                                var visitHistory = new VisitHistoryModel({
                                                    visitorId: visitor._id,
                                                    placeId: place._id,
                                                    imagePath: photoPath,
                                                });
                                                visitHistory.save();
                                            }
                                        });
                                    } else {
                                        res.send(new ResponseError(2002));
                                    }
                                } else {
                                    res.send(new ResponseError(1004));
                                }
                            } else {
                                res.send(new ResponseError(1006));
                            }
                        }
                    });
                }
            }
        });
    });
});

router.post('/checkin', function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        if (!(fields.placeid && fields.placeid[0] 
                && fields.photo_imgpath && fields.photo_imgpath[0]
                && fields.photo_feature && fields.photo_feature[0])) {
            res.sendStatus(400);
            return;
        }
        var placeid = fields.placeid[0];
        var photo_feature = null;
        try {
            photo_feature = JSON.parse(fields.photo_feature[0]);
        } catch (e) {}
        if (!photo_feature) {
            res.sendStatus(400);
            return;
        }
        PlaceModel.findOne({ _id: placeid }, {}, function(err, place) {
            if (err) {
                new CommonError("An error occured when check in", err).print();
                res.sendStatus(500);
            } else {
                if (place) {
                    if (place.roles.indexOf('o2n') >= 0) {
                        var photoPath = fields.photo_imgpath[0];
                        var today = new Date();
                        VisitorModel.find({
                            "validPeriod.start": { "$lte": today },
                            "validPeriod.end": { "$gt": today }
                        }, {}, function(err, visitors) {
                            if (err) {
                                new CommonError("An error occured when get visitors", err).print();
                                res.sendStatus(500);
                            } else {
                                var visitor = service.recognizeVisitor(photo_feature, visitors);
                                if (visitor) {
                                    var visitHistory = new VisitHistoryModel({
                                        visitorId: visitor._id,
                                        placeId: place._id,
                                        imagePath: photoPath
                                    });
                                    visitHistory.save();
                                    res.send(new ResponseError(0, null, {visitor: {
                                        "_id": visitor._id,
                                        "cid": visitor.cid,
                                        "name": visitor.name,
                                        "photo": "/public/uploads/" + visitor.face.imagePath
                                    }}));
                                } else {
                                    res.send(new ResponseError(2001));
                                }
                            }
                        });
                    } else {
                        res.send(new ResponseError(1004));
                    }
                } else {
                    res.send(new ResponseError(1005));
                }
            }
        });
    });
});

module.exports = router;

/**
 * save the uploaded image
 * @param  {file object} fileObj file object
 * @return {string}              the saved file name
 */
function _cpimage(fileObj) {
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














