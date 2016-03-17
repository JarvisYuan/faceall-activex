module.exports = function(mongoose) {
    if (!mongoose.models['RegisterHistory']) mongoose.model('RegisterHistory', RegisterHistorySchema());
    return mongoose.models['RegisterHistory'];
};

function RegisterHistorySchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        visitorId: Schema.Types.ObjectId,
        placeId: Schema.Types.ObjectId,
        imageId: Schema.Types.ObjectId,
        time: { type: Date, default: Date.now }
    });
}