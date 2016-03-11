module.exports = function(db) {
    return db.model('Place', PlaceSchema());
};

function PlaceSchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        name: String,
        roles: { type: [ String ], default: ['o2o'] } // o2o | o2n
    });
}