module.exports = function(db) {
    return db.model('Visitor', VisitorSchema());
};

function VisitorSchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        name: String,
        cid: String,
        register_time: {
            type: Date,
            default: Date.now
        },
        valid_period: {
            start: {
                type: Date,
                default: function() {
                    var d = new Date();
                    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).getTime();
                }
            },
            end: {
                type: Date,
                default: function() {
                    var d = new Date();
                    return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1).getTime();
                }
            }
        }
    });
}