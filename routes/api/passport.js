var express = require('express');
var router = express.Router();
var multiparty = require('multiparty');
var fs = require('fs');
var path = require('path');
var uuid = require('node-uuid');
var mongoose = require('mongoose');

var config = require('../../lib/config');
var service_helper = require('../../lib/service_helper');
var CommonError = require('../../lib/error').CommonError;
var ResponseError = require('../../lib/error').ResponseError;

var VisitorModel = require('../../lib/models/visitor')(mongoose);
var ImageModel = require('../../lib/models/image')(mongoose);
var RegisterHistoryModel = require('../../lib/models/register_history')(mongoose);
var VisitHistoryModel = require('../../lib/models/visit_history')(mongoose);
var PlaceModel = require('../../lib/models/place')(mongoose);

router.post('/register', function(req, res, next) {
    var form = new multiparty.Form();
    form.parse(req, function (err, fields, files) {
        var cid = fields.cid[0];
        var name = fields.name[0];
        var placeid = fields.placeid[0];
        if (!(cid && name && placeid && files['photo'] && (files['photo'].length > 0) && files['portrait'] && (files['portrait'].length > 0))) {
            res.sendStatus(400);
            return;
        }
        VisitorModel.findOne({ cid: cid }, {}, function(err, visitor) {
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
                                if (place.roles.indexOf('o2n') >= 0) {
                                    var photoFile = files['photo'][0];
                                    var portraitFile = files['portrait'][0];
                                    var photoImage, portraitImage;
                                    service_helper.addImage(photoFile.path, function(err, resErr, image) {
                                        if (err) {
                                            new CommonError("An error occured when detect photo", err).print();
                                            res.sendStatus(500);
                                        } else if (resErr) {
                                            if (resErr.status == 1001) {
                                                res.send(new ResponseError(1001));
                                            } else {
                                                res.send(resErr);
                                            }
                                        } else {
                                            photoImage = image;
                                            service_helper.addImage(portraitFile.path, function(err, resErr, image) {
                                                if (err) {
                                                    new CommonError("An error occured when detect portrait", err).print();
                                                    res.sendStatus(500);
                                                } else if (resErr) {
                                                    if (resErr.status == 1001) {
                                                        res.send(new ResponseError(1002));
                                                    } else {
                                                        res.send(resErr);
                                                    }
                                                } else {
                                                    portraitImage = image;
                                                    service_helper.varifyFace(photoImage.faceIds[0], portraitImage.faceIds[0], function(err, resErr, result) {
                                                        if (err) {
                                                            new CommonError("An error occured when detect portrait", err).print();
                                                            res.sendStatus(500);
                                                        } else if (resErr) {
                                                            res.send(resErr);
                                                        } else if (result.score < config.compare.score_threshold) {
                                                            res.send(new ResponseError(2002));
                                                        } else {
                                                            if (visitor) {
                                                                visitor.validPeriod.start = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()).getTime();
                                                                visitor.validPeriod.end = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1).getTime();
                                                                visitor.markModified('validPeriod');
                                                                visitor.name = name;
                                                                visitor.faceId = portraitImage.faceIds[0];
                                                            } else {
                                                                visitor = new VisitorModel({
                                                                    cid: cid,
                                                                    name: name,
                                                                    faceId: portraitImage.faceIds[0]
                                                                });
                                                            }
                                                            service_helper.addFaces(visitor.faceId, function(err, resErr) {
                                                                if (err) {
                                                                    new CommonError("An error occured when add face", err).print();
                                                                    res.sendStatus(500);
                                                                } else if (resErr) {
                                                                    res.send(resErr);
                                                                } else {
                                                                    visitor.save(function(err) {
                                                                        if (err) {
                                                                            service_helper.removeFaces(visitor.faceId);
                                                                            new CommonError("An error occured when register", {error: err}).print();
                                                                            res.sendStatus(500);
                                                                        } else {
                                                                            res.send(ResponseError.SUCCESS);
                                                                            var registerHistory = new RegisterHistoryModel({
                                                                                visitorId: visitor._id,
                                                                                placeId: place._id,
                                                                                imageId: portraitImage._id,
                                                                            });
                                                                            registerHistory.save();
                                                                            var visitHistory = new VisitHistoryModel({
                                                                                visitorId: visitor._id,
                                                                                placeId: place._id,
                                                                                imageId: photoImage._id,
                                                                            });
                                                                            visitHistory.save();
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
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
        var placeid = fields.placeid[0];
        if (!(placeid && files['photo'] && (files['photo'].length > 0))) {
            res.sendStatus(400);
            return;
        }
        PlaceModel.findOne({ _id: placeid }, {}, function(err, place) {
            if (err) {
                new CommonError("An error occured when check in", err).print();
                res.sendStatus(500);
            } else {
                if (place) {
                    if (place.roles.indexOf('o2o') >= 0) {
                        var photoFile = files['photo'][0];
                        var photoImage;
                        service_helper.addImage(photoFile.path, function(err, resErr, image) {
                            if (err) {
                                new CommonError("An error occured when detect photo", err).print();
                                res.sendStatus(500);
                            } else if (resErr) {
                                res.send(resErr);
                            } else {
                                photoImage = image;
                                service_helper.recognizeVisitor(photoImage.faceIds[0], config.compare.score_threshold, function(err, resErr, visitor) {
                                    if (err) {
                                        new CommonError("An error occured when detect photo", err).print();
                                        res.sendStatus(500);
                                    } else if (resErr) {
                                        res.send(resErr);
                                    } else if (!visitor) {
                                        res.send(new ResponseError(2001));
                                    } else {
                                        var visitHistory = new VisitHistoryModel({
                                            visitorId: visitor._id,
                                            placeId: place._id,
                                            imageId: photoImage._id,
                                        });
                                        visitHistory.save();
                                        res.send(new ResponseError(0, null, {visitor: visitor}));
                                    }
                                });
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














