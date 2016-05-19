var mongoose = require('mongoose');
var config = require('./config');
var VisitorModel = require('./models/visitor')(mongoose);
var CommonError = require('./error').CommonError;
var ResponseError = require('./error').ResponseError;

exports.compareFace = compareFace;
exports.verifyFace = verifyFace;
exports.veryfyVisitor = veryfyVisitor;
exports.recognizeVisitor = recognizeVisitor;

/**
 * compare two faces and returns a score
 * @param  {[number]} face_feature_1 the feature vector of face 1
 * @param  {[number]} face_feature_2 the feature vector of face 2
 * @return {number}                  the score
 */
function compareFace(face_feature_1, face_feature_2) {
    return uniformL2Distance(l2Distance(face_feature_1, face_feature_2));
}

/**
 * calculate the L2 distance (Euler distance) between two features
 * @param  {[number]} face_feature_1 the feature vector of face 1
 * @param  {[number]} face_feature_2 the feature vector of face 2
 * @return {number}                  the distance. if not valid, return -1
 */
function l2Distance(face_feature_1, face_feature_2) {
    var feature_size = config.recognize.feature_length;
    if ((face_feature_1.length != feature_size) || (face_feature_2.length != feature_size)) {
        return -1;
    }
    var dist = 0;
    for (var i = 0; i < feature_size; i++) {
        dist += (face_feature_1[i] - face_feature_2[i]) * (face_feature_1[i] - face_feature_2[i]);
    }
    return dist;
}

/**
 * uniformize the L2 distance (Euler distance), give a score between 0 to 1
 * @param  {number} distance L2 distance
 * @return {number}          the score
 */
function uniformL2Distance(distance) {
    var feature_scaler_1 = config.recognize.feature_scaler_1;
    var feature_scaler_2 = config.recognize.feature_scaler_2;
    var feature_logreg_1 = config.recognize.feature_logreg_1;
    var feature_logreg_2 = config.recognize.feature_logreg_2;
    var score = -distance;
    if (score > 0) return 0;
    score = (score - feature_scaler_1)/feature_scaler_2;
    score = 1/(1 + Math.exp(-feature_logreg_1 * score - feature_logreg_2));
    return score;
}

/**
 * verify if two faces are matched
 * @param  {[number]} face_feature_1 the feature vector of face 1
 * @param  {[number]} face_feature_2 the feature vector of face 2
 * @return {boolean}                 if the two faces are matched
 */
function verifyFace(face_feature_1, face_feature_2) {
    return (compareFace(face_feature_1, face_feature_2) > config.recognize.score_threshold);
}

/**
 * verify if a face is a visitor
 * @param  {[number]} face_feature the feature of the face
 * @param  {visitor} visitor       the visitor
 * @return {boolean}               if the face is the visitor
 */
function veryfyVisitor(face_feature, visitor) {
    return verifyFace(face_feature, visitor.face.feature);
}

/**
 * recognize a visitor
 * @param  {[number]}  face_feature  the feature vector of the face
 * @param  {[visitor]} visitors      the visitors to find in
 * @return {visitor}                 the best matched visitor (instance of VisitorModel).
 *                                   if no matched visitor, return null
 */
function recognizeVisitor(face_feature, visitors) {
    var TOP_COUNT = 10;
    var minDistance = -1;
    var maxVisitor = null;
    var distances = [];
    var topVisitors = [];
    var topDistances = [];
    visitors.forEach(function(visitor) {
        var dist = l2Distance(visitor.face.feature, face_feature);
        if ((dist < minDistance) || (minDistance < 0)) {
            minDistance = dist;
            maxVisitor = visitor;
        }
        if (topDistances.length == 0) {
            topDistances.push(dist);
            topVisitors.push(visitor);
        } else {
            var inserted = false;
            for (var i = 0; i < topDistances.length; i++) {
                if (dist < topDistances[0]) {
                    topDistances.splice(i,0,dist);
                    topVisitors.splice(i,0,visitor);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                topDistances.push(dist);
                topVisitors.push(visitor);
            }
            if (topDistances.length > TOP_COUNT) {
                topDistances = topDistances.slice(0,TOP_COUNT);
                topVisitors = topVisitors.slice(0,TOP_COUNT);
            }
        }
    });
    var result = [];
    for (var i = 0; i < topDistances.length; i++) {
        result.push({
            score: uniformL2Distance(topDistances[i]),
            visitor: topVisitors[i]
        });
    }
    return result;
}