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
        if (!fields) fields = (function(req) {
            var ret = {};
            for (var k in req.body) {
                ret[k] = [req.body[k]];
            }
            return ret;
        })(req); // x-www-form-urlencoded
        if (!fields) { res.sendStatus(400); return; }
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
        if (!fields) fields = (function(req) {
            var ret = {};
            for (var k in req.body) {
                ret[k] = [req.body[k]];
            }
            return ret;
        })(req); // x-www-form-urlencoded
        if (!fields) { res.sendStatus(400); return; }
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
                                var visitors = service.recognizeVisitor(photo_feature, visitors);
                                var resultMeta = {visitors: []};
                                for (var i = 0; i < visitors.length; i++) {
                                    resultMeta.visitors.push({
                                        "_id": visitors[i].visitor._id,
                                        "cid": visitors[i].visitor.cid,
                                        "name": visitors[i].visitor.name,
                                        "photo": "/uploads/" + visitors[i].visitor.face.imagePath,
                                        "score": visitors[i].score
                                    });
                                }
                                if ((visitors.length > 0) && (visitors[0].score > config.recognize.score_threshold)) {
                                    var visitHistory = new VisitHistoryModel({
                                        visitorId: visitors[0].visitor._id,
                                        placeId: place._id,
                                        imagePath: photoPath
                                    });
                                    visitHistory.save();
                                    res.send(new ResponseError(0, null, resultMeta));
                                } else {
                                    res.send(new ResponseError(2001, "no match visitor", resultMeta));
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













