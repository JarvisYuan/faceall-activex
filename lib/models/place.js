module.exports = function(mongoose) {
    if (!mongoose.models['Place']) mongoose.model('Place', PlaceSchema());
    return mongoose.models['Place'];
};

function PlaceSchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        name: String,
        roles: { type: [ String ], default: ['o2o'] } // o2o | o2n
    });
}