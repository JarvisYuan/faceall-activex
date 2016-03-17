var mongoose = require('mongoose');
var config = require('./config');
var service = require('./service');
var ImageModel = require('./models/image')(mongoose);
var VisitorModel = require('./models/visitor')(mongoose);
var CommonError = require('./error').CommonError;
var ResponseError = require('./error').ResponseError;

var FACESET_NAME = "idcard";

exports._facesets = {};

exports.addImage = addImage;
exports.getFaceset = getFaceset;
exports.addFaces = addFaces;
exports.waitTrained = waitTrained;
exports.varifyFace = varifyFace;
exports.recognizeFace = recognizeFace;
exports.recognizeVisitor = recognizeVisitor;

/**
 * add photo image to database and service
 * @param {string}   imagePath path to image
 * @param {Function} callback  
 *        err: CommonError to throw out
 *        resErr: ResponseError to response
 *        image: instance of ImageModel, the added image
 */
function addImage (imagePath, callback) {
    callback = callback || function(){};
    service.detection.detect(imagePath, false, function(err, res, body) {
        body = parseCommonJsonResponse(err, res, body, callback);
        if (body instanceof CommonError) {
            callback(body);
            return;
        }
        if (body.faces.length > 0) {
            var faceIds = [];
            for (var i = 0; i < body.faces.length; i++) {
                faceIds.push(body.faces[i].id);
            }
            var image = new ImageModel({
                apiId: body.image_id,
                faceIds: faceIds
            });
            image.save(function(err) {
                if (err) {
                    callback(new CommonError("insert to database failed", {error: err }));
                } else {
                    callback(undefined, undefined, image);
                }
            });
        } else {
            callback(undefined, new ResponseError(1001));
        }
    });
}

/**
 * get the unique faceset
 * @param {Function} callback  
 *        err: CommonError to throw out
 *        resErr: ResponseError to response
 *        faceset: faceset object
 */
function getFaceset (callback) {
    callback = callback || function(){};
    var today = new Date();
    var startOfToday = new Date(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    if (exports._facesets.idcard && (exports._facesets.idcard.meta.create_at >= startOfToday)) {
        callback(undefined, undefined, exports._facesets.idcard);
    } else {
        service.faceset.getList(function(err, res, body) {
            var briefList = parseCommonJsonResponse(err, res, body);
            if (briefList instanceof CommonError) {
                callback(briefList);
                return;
            }
            if (briefList.length > 0) {
                var info = null;
                var doneCnt = 0;
                var hasError = false;
                for (var i = 0; i < briefList.length; i++) {
                    service.faceset.getInfo(briefList[i].id, function(err, res, body) {
                        body = parseCommonJsonResponse(err, res, body);
                        if (hasError) return;
                        if (body instanceof CommonError) {
                            callback(body);
                            hasError = true;
                            return;
                        }
                        body = parseFacesetInfo(body);
                        if (!body) callback(new CommonError("could not find faceset"));
                        if ((!info) || (body.meta.create_at > info.meta.create_at)) info = body;
                        doneCnt += 1;
                        if (doneCnt == briefList.length) {
                            var doneCnt2 = 0;
                            var hasError2 = false;
                            var allDeleted = false;
                            for (var j = 0; j < briefList.length; j++) {
                                if (briefList[j].id != info.id) {
                                    service.faceset.delete(briefList[j].id, function (err, res, body) {
                                        if (hasError2) return;
                                        body = parseCommonJsonResponse(err, res, body);
                                        if (body instanceof CommonError) {
                                            callback(body);
                                            hasError2 = true;
                                        } else if (!body.success) {
                                            callback(new CommonError("delete failed"));
                                            hasError2 = true;
                                        } else {
                                            doneCnt2 += 1;
                                            if (doneCnt2 == briefList.length) callback(undefined, undefined, exports._facesets.idcard);
                                        }
                                    });
                                }
                            }
                            if (info.meta.create_at < startOfToday) {
                                var infoDeleted = false;
                                var facesetCreated = false;
                                service.faceset.delete(info.id, function (err, res, body) {
                                    if (hasError2) return;
                                    body = parseCommonJsonResponse(err, res, body);
                                    if (body instanceof CommonError) {
                                        callback(body);
                                        hasError2 = true;
                                    } else if (!body.success) {
                                        callback(new CommonError("delete failed"));
                                        hasError2 = true;
                                    } else {
                                        infoDeleted = true;
                                        if (infoDeleted && facesetCreated) {
                                            doneCnt2 += 1;
                                            if (doneCnt2 == briefList.length) callback(undefined, undefined, exports._facesets.idcard);
                                        }
                                    }
                                });
                                createFaceset(function(err, resErr, faceset) {
                                    if (hasError2) return;
                                    if (err) {
                                        callback(err);
                                        hasError2 = true;
                                        return;
                                    } else if (resErr) {
                                        callback(undefined, resErr);
                                        hasError2 = true;
                                        return;
                                    } else {
                                        facesetCreated = true;
                                        if (infoDeleted && facesetCreated) {
                                            exports._facesets.idcard = faceset;
                                            doneCnt2 += 1;
                                            if (doneCnt2 == briefList.length) callback(undefined, undefined, exports._facesets.idcard);
                                        }
                                    }
                                });
                            } else {
                                exports._facesets.idcard = info;
                                doneCnt2 += 1;
                                if (doneCnt2 == briefList.length) callback(undefined, undefined, exports._facesets.idcard);
                            }
                        }
                    });
                }
            } else {
                createFaceset(function(err, resErr, faceset) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (resErr) {
                        callback(undefined, resErr);
                        return;
                    }
                    exports._facesets.idcard = faceset;
                    callback(undefined, undefined, exports._facesets.idcard);
                });
            }
        });
    }
}

/**
 * add face to the unique faceset
 * @param {string}   faces    the faces to add
 * @param {Function} callback  
 *        err: CommonError to throw out
 *        resErr: ResponseError to response
 */
function addFaces (faces, callback) {
    callback = callback || function(){};
    faces = service.utils.parseFacesArgToFaceIds(faces);
    getFaceset(function(err, resErr, faceset) {
        if (err) {
            callback(err);
        } else if (resErr) {
            callback(undefined, resErr);
        } else {
            service.faceset.addFaces(faceset.id, faces, function(err, res, body) {
                body = parseCommonJsonResponse(err, res, body);
                if (body instanceof CommonError) {
                    callback(body);
                } else if (!body.success) {
                    callback(new CommonError("add faces failed"));
                } else {
                    for (var i = 0; i < faces.length; i++) {
                        if ((faceset.faces.indexOf(faces[i]) < 0) && (body.success.indexOf(faces[i]) < 0)) {
                            callback(new CommonError("not all faces are successfully added"));
                            return;
                        }
                    }
                    service.faceset.train(faceset.id, 'id', true, function(err, res, body) {
                        body = parseCommonJsonResponse(err, res, body, callback);
                        if (body instanceof CommonError) {
                            callback(body);
                            return;
                        } else if (!body.success) {
                            callback(new CommonError("train failed"));
                        } else {
                            callback(undefined, undefined);
                        }
                    });
                }
            });
        }
    });
}

/**
 * remove face from the unique faceset
 * @param {string}   faces    the faces to remove
 * @param {Function} callback  
 *        err: CommonError to throw out
 *        resErr: ResponseError to response
 */
function removeFaces (faces, callback) {
    callback = callback || function(){};
    faces = service.utils.parseFacesArgToFaceIds(faces);
    getFaceset(function(err, resErr, faceset) {
        if (err) {
            callback(err);
        } else if (resErr) {
            callback(undefined, resErr);
        } else {
            var facesToRemove = faces.length;
            for (var i = 0; i < faces.length; i++) {
                if ((faceset.faces.indexOf(faces[i]) < 0) && (body.success.indexOf(faces[i]) < 0)) {
                    facesToRemove -= 1;
                }
            }
            service.faceset.removeFaces(faceset.id, faces, function(err, res, body) {
                body = parseCommonJsonResponse(err, res, body);
                if (body instanceof CommonError) {
                    callback(body);
                } else if (!body.success) {
                    callback(new CommonError("remove faces failed"));
                } else {
                    if (body.count < facesToRemove) {
                        callback(new CommonError("not all faces are successfully removed"));
                        return;
                    }
                    service.faceset.train(faceset.id, 'id', true, function(err, res, body) {
                        body = parseCommonJsonResponse(err, res, body, callback);
                        if (body instanceof CommonError) {
                            callback(body);
                            return;
                        } else if (!body.success) {
                            callback(new CommonError("train failed"));
                        } else {
                            callback(undefined, undefined);
                        }
                    });
                }
            });
        }
    });
}

/**
 * wait for the unique faceset training complete
 * @param  {number}   timeout       Max pools to try. If set to 0, the waiting will never end until training is done. Default is 0
 * @param  {number}   pool_interval default interval (milliseconds) between each pool request, default is 10
 * @param  {number}   max_errors    max errors to tolerate in each pool, default is 3
 * @param  {Function} callback      will be called after training is done, timeout reached or too many error occured
 *        err: CommonError to throw out
 *        resErr: ResponseError to response
 *        trained: Boolean
 */
function waitTrained (callback, timeout, pool_interval, max_errors) {
    callback = callback || function(){};
    if (typeof timeout !== "number") timeout = 0;
    if (typeof pool_interval !== "number") pool_interval = 10;
    if (typeof max_errors !== "number") max_errors = 3;

    getFaceset(function(err, resErr, faceset) {
        if (err) {
            callback(err);
        } else if (resErr) {
            callback(undefined, resErr);
        } else if (faceset.status == "done") {
            callback(undefined, undefined, true);
        } else if (faceset.faces.length == 0) {
            callback(undefined, undefined, false);
        } else {
            var faceset_id = faceset.id;
            var totalPools = 0;
            var quit_flag = false;

            function pool() {
                var errorTimes = 0;

                request();

                function request() {
                    service.faceset.getInfo(faceset_id, function(err, res, body) {
                        body = parseCommonJsonResponse(err, res, body);
                        if (body instanceof CommonError) {
                            errorTimes += 1;
                            if (errorTimes >= max_errors) {
                                callback(new CommonError("error time exceed", body));
                                quit_flag = true;
                            } else {
                                request();
                            }
                        } else {
                            body = parseFacesetInfo(body);
                            if (!body) {
                                callback(new CommonError("could not find faceset"));
                                quit_flag = true;
                            } else {
                                if (body.status == "done") {
                                    callback(undefined, undefined, true);
                                    quit_flag = true;
                                } else if (body.faces.length == 0) {
                                    callback(undefined, undefined, false);
                                } else {
                                    totalPools += 1;
                                    if (totalPools >= timeout) {
                                        callback(new CommonError("timeout exceed"));
                                        quit_flag = true;
                                    } else {
                                        setTimeout(pool, pool_interval);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    });
}

/**
 * compare two faces and give a score
 * @param  {string} face_id_1 face id 1
 * @param  {string} face_id_2 face id 2
 * @param  {Function} callback 
 *         err: CommonError to throw out
 *         resErr: ResponseError to response
 *         result: the score
 */
function varifyFace (face_id_1, face_id_2, callback) {
    service.recognition.compareFace(face_id_1, face_id_2, null, function(err, res, body) {
        body = parseCommonJsonResponse(err, res, body);
        if (body instanceof CommonError) {
            callback(new CommonError("error time exceed", body));
        } else {
            if (body.score) {
                callback(undefined, undefined, { score: body.score })
            } else {
                callback(new CommonError("An error occured when compare two faces", { resp: body }));
            }
        }
    });
}

/**
 * recognize a face in the unique faceset
 * @param  {string}   face_id  face id
 * @param  {Function} callback 
 *         err: CommonError to throw out
 *         resErr: ResponseError to response
 *         face: the matched faces [(face_id, score)].
 */
function recognizeFace (face_id, limit, callback) {
    limit = limit || 1;
    waitTrained(function(err, resErr, trained) {
        if (err) {
            callback(err);
        } else if (resErr) {
            callback(undefined, resErr);
        } else {
            if (trained) {
                getFaceset(function(err, resErr, faceset) {
                    if (err) {
                        callback(err);
                    } else if (resErr) {
                        callback(undefined, resErr);
                    } else {
                        service.recognition.compareFaceFaceset(face_id, faceset.id, limit, function(err, res, body) {
                            body = parseCommonJsonResponse(err, res, body);
                            if (body instanceof CommonError) {
                                callback(body);
                            } else {
                                var matchedFaces = [];
                                for (var i = 0; i < body.scores.length; i++) {
                                    matchedFaces.push({
                                        face_id: body.scores[i].face_id,
                                        score: body.scores[i].score
                                    });
                                }
                                callback(undefined, undefined, matchedFaces);
                            }
                        });
                    }
                });
            } else {
                callback(undefined, undefined, []);
            }
        }
    });
}

/**
 * recognize a visitor in the unique faceset
 * @param  {string}   face_id  face id
 * @param  {Function} callback 
 *         err: CommonError to throw out
 *         resErr: ResponseError to response
 *         visitor: the best matched visitor (instance of VisitorModel).
 */
function recognizeVisitor (face_id, threshold, callback) {
    recognizeFace(face_id, 50, function (err, resErr, faces) {
        if (err) {
            callback(err);
        } else if (resErr) {
            callback(undefined, resErr);
        } else {
            var i = 0;
            var today = new Date();
            function visitorFindCallback(err, visitor) {
                if (err) {
                    callback(new CommonError("query visitor error", { error: err }));
                } else {
                    if ((i > 0) && (faces[i-1].score < threshold)) {
                        callback(undefined, undefined, null)
                    } else if (visitor) {
                        callback(undefined, undefined, visitor);
                    } else {
                        if (i < faces.length) {
                            VisitorModel.findOne({
                                "faceId": faces[i].face_id,
                                "validPeriod.start": { "$lte": today },
                                "validPeriod.end": { "$gt": today },
                            }, {}, function(err, visitor) {
                                visitorFindCallback(err, visitor);
                            });
                        } else {
                            callback(undefined, undefined, null);
                        }
                        i += 1;
                    }
                }
            };
            visitorFindCallback();
        }
    });
}

/**
 * Parse service api response in JSON format to JSON object.
 * @param  {error}      err      the request error
 * @param  {Response}   res      the response object
 * @param  {string}     body     the response body
 * @return {object|CommonError}            if success, returns the parsed object
 *                                         if failed, returns the error
 */
function parseCommonJsonResponse (err, res, body) {
    if (err) {
        return new CommonError("an error occured during request", {error:err});
    } else if (res.statusCode != 200) {
        return new CommonError("request failed with statusCode" + res.statusCode);
    } else {
        try {
            body = JSON.parse(body);
            bodyParsed = true;
        } catch (err) {
            return new CommonError("an error occured when parsing the response", {error:err});
        }
        return body;
    }
}

/**
 * parse the faceset info returned by faceset.getInfo
 * if info_json is not a valid faceset, returns null
 * @param  {[type]} info_json [description]
 * @return {[type]}           [description]
 */
function parseFacesetInfo (info_json) {
    if (!info_json.id) return null;
    info_json.meta.create_at = new Date(info_json.meta.create_at);
    info_json.meta.update_at = new Date(info_json.meta.update_at);
    return info_json;
}

/**
 * create a faceset
 * @param {Function} callback  
 *        err: CommonError to throw out
 *        resErr: ResponseError to response
 *        faceset: created faceset object
 */
function createFaceset (callback) {
    callback = callback || function(){};
    service.faceset.create(FACESET_NAME, function(err, res, body) {
        body = parseCommonJsonResponse(err, res, body);
        if (body instanceof CommonError) {
            callback(body);
            return;
        }
        service.faceset.getInfo(body.id, function(err, res, body) {
            body = parseCommonJsonResponse(err, res, body);
            if (body instanceof CommonError) {
                callback(body);
                return;
            }
            body = parseFacesetInfo(body);
            callback(undefined, undefined, body);
        });
    });
}











