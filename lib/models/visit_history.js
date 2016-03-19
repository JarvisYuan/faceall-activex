module.exports = function(mongoose) {
    if (!mongoose.models['VisitHistory']) mongoose.model('VisitHistory', VisitHistorySchema());
    return mongoose.models['VisitHistory'];
};

function VisitHistorySchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        visitorId: Schema.Types.ObjectId,
        placeId: Schema.Types.ObjectId,
        imagePath: { type: String, default: null },
        time: { type: Date, default: Date.now }
    });
}