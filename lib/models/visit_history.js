module.exports = function(db) {
    return db.model('VisitHistory', VisitHistorySchema());
};

function VisitHistorySchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        visitor_id: Schema.Types.ObjectId,
        place_id: Schema.Types.ObjectId,
        time: { type: Date, default: Date.now }
    });
}