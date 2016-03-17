var mongoose = require('mongoose');
var config = require('./config');
var service = require('./service');
var ImageModel = require('./models/image')(mongoose);
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
 *         face: the score
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
 *         face: the most match face (face_id, score). If no face matched, face_id is null, score is 0
 */
function recognizeFace (face_id, callback) {
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
                        service.recognition.compareFaceFaceset(face_id, faceset.id, 1, function(err, res, body) {
                            body = parseCommonJsonResponse(err, res, body);
                            if (body instanceof CommonError) {
                                callback(body);
                            } else {
                                if (body.scores.length > 0) {
                                    callback(undefined, undefined, {
                                        face_id: body.scores[0].face_id,
                                        score: body.scores[0].score
                                    });
                                } else {
                                    // callback(undefined, new ResponseError(2001));
                                    callback(undefined, undefined, {
                                        face_id: null,
                                        score: 0
                                    });
                                }
                            }
                        });
                    }
                });
            } else {
                callback(undefined, undefined, {
                    face_id: null,
                    score: 0
                });
            }
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
        callback(err);
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











