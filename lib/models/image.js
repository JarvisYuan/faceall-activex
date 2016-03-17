module.exports = function(mongoose) {
    if (!mongoose.models['Image']) mongoose.model('Image', ImageSchema());
    return mongoose.models['Image'];
};

function ImageSchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        apiId: String,
        faceIds: [String] // api id of the faces
    });
}