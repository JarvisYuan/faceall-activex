 /**
 * Module to call Faceall API services.
 * Module has several sub-modules, each sub-module represents a category of functions.
 * Each sub-module has several functions (f-func), each f-func represents an api.
 * Each f-func returns the request.
 * F-func argument callback is the callback function, with arguments:
 *     error: the error of the request
 *     response: the response of the request
 *     body: the body of the response
 */

var config = require('./config');
var request = require('request');
var fs = require('fs');

var getRequest = function(funcType, funcName, queryFields, callback) {
    queryFields = queryFields || {};
    var url = config.api.server + "/" + funcType + "/" + funcName + "?api_key=" + config.api.key + "&api_secret=" + config.api.secret;
    for (var k in queryFields) {
        url = url + "&" + k + "=" + queryFields[k];
    }
    return request.get(url, callback);
};

var postRequest = function(funcType, funcName, queryFields, callback) {
    queryFields = queryFields || {};
    var url = config.api.server + "/" + funcType + "/" + funcName;
    var r = request.post(url, callback);
    var form = r.form()
    form.append('api_key', config.api.key);
    form.append('api_secret', config.api.secret);
    for (var k in queryFields) {
        form.append(k, queryFields[k]);
    }
    return r;
};

exports.detection = {};

/**
 * @param  {string}   imagePath  path to the image
 * @param  {boolean}  attributes if the api should call attributes api
 */
exports.detection.detect = function(imagePath, attributes, callback) {
    var file;
    try {
        file = fs.createReadStream(imagePath);
    } catch (e) {
        callback("could not read file");
    }
    var payload = {
        attributes: attributes ? "true" : "false",
        img_file: file
    };
    return postRequest('detection', 'detect', payload, callback);
};

exports.faceset = {};

/**
 * @param  {string}   name     name of the faceset
 */
exports.faceset.create = function(name, callback) {
    var payload = { faceset_name: name };
    return getRequest('faceset', 'create', payload, callback);
};

/**
 * @param  {string}   faceset_id id of the faceset
 */
exports.faceset.delete = function(faceset_id, callback) {
    var payload = { faceset_id: faceset_id };
    return getRequest('faceset', 'delete', payload, callback);
};

/**
 * @param {string}          faceset_id   id of the faceset
 * @param {string|object}   faces        (array of) faces items or ids
 */
exports.faceset.addFaces = function(faceset_id, faces, callback) {
    faces = parseFacesArgToFaceIds(faces);
    if (faces.length > 0) {
        var payload = {
            faceset_id: faceset_id,
            face_id: faces.join(",")
        };
        return getRequest('faceset', 'add_faces', payload, callback);
    } else {
        callback("no face to add");
    }
};

/**
 * @param {string}          faceset_id   id of the faceset
 * @param {string|object}   faces        (array of) faces items or ids
 */
exports.faceset.removeFaces = function(faceset_id, faces, callback) {
    faces = parseFacesArgToFaceIds(faces);
    if (faces.length > 0) {
        var payload = {
            faceset_id: faceset_id,
            face_id: faces.join(",")
        };
        return getRequest('faceset', 'remove_faces', payload, callback);
    } else {
        callback("no face to remove");
    }
};

/**
 * @param  {string}   faceset_id id of the faceset
 * @param  {string}   type       id | life(default)
 * @param  {boolean}  async      async
 */
exports.faceset.train = function(faceset_id, type, async, callback) {
    var payload = {
        faceset_id: faceset_id,
        type: (type == "id") ? "id" : "life",
        async: async ? "true" : "false"
    };
    return getRequest('faceset', 'train', payload, callback);
};

/**
 */
exports.faceset.getList = function(callback) {
    return getRequest('faceset', 'get_list', null, callback);
};

/**
 * @param  {string}   faceset_id id of the faceset
 */
exports.faceset.getInfo = function(faceset_id, callback) {
    var payload = { faceset_id: faceset_id };
    return getRequest('faceset', 'get_info', payload, callback);
};

/**
 * @param  {string}   faceset_id id of the faceset
 * @param  {string}   name       new name of the faceset
 */
exports.faceset.setInfo = function(faceset_id, name, callback) {
    var payload = {
        faceset_id: faceset_id,
        faceset_name: name
    };
    return getRequest('faceset', 'set_info', payload, callback);
};

exports.recognition = {};

/**
 * @param  {string}   face_id_1 id of face 1
 * @param  {string}   face_id_2 id of face 2
 * @param  {string}   type      life | id
 */
exports.recognition.compareFace = function(face_id_1, face_id_2, type, callback) {
    var payload = {
        face_id1: face_id_1,
        face_id2: face_id_2,
        type: (type == "id") ? "id" : "life",
    };
    return getRequest('recognition', 'compare_face', payload, callback);
};

/**
 * @param  {string}   face_id    id of the face
 * @param  {string}   faceset_id id of the faceset
 * @param  {number}   limit      limit count of the returned faces, default is 5
 */
exports.recognition.compareFaceFaceset = function(face_id, faceset_id, limit, callback) {
    var payload = {
        face_id: face_id,
        faceset_id: faceset_id,
        limit: limit || 5
    };
    return getRequest('recognition', 'compare_face_faceset', payload, callback);
};

exports.utils = {
    parseFacesArgToFaceIds: parseFacesArgToFaceIds
};

function parseFacesArgToFaceIds(faces) {
    if (!(faces instanceof Array)) faces = [faces];
    for (var i = faces.length - 1; i >= 0; i--) {
        if ((typeof faces[i] === "object") && (faces[i].id)) faces[i] = faces[i].id;
        if (typeof faces[i] !== "string") faces = faces.splice(i,1);
    }
    return faces;
}













