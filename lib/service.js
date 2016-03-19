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
    return 1;
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
    var maxScore = 0;
    var maxVisitor = null;
    visitors.forEach(function(visitor) {
        var score = compareFace(visitor.face.feature, face_feature);
        if (score > maxScore) {
            maxScore = score;
            maxVisitor = visitor;
        }
    });
    if (maxScore > config.recognize.score_threshold) return maxVisitor;
    else return null;
}