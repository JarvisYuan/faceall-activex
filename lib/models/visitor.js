var config = require('../config');

module.exports = function(mongoose) {
    if (!mongoose.models['Visitor']) mongoose.model('Visitor', VisitorSchema());
    return mongoose.models['Visitor'];
};

function VisitorSchema() {
    var Schema = require('mongoose').Schema;
    return new Schema({
        name: {
            type: String,
            required: true
        },
        cid: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    return /^\d{17}[\dxX]$/.test(v);
                }
            }
        },
        face: {
            feature: {
                type: [Number],
                required: true,
                validate: {
                    validator: function(v) {
                        if (v.length != config.recognize.feature_length) return false;
                        return true;
                    }
                }
            },
            imagePath: {
                type: String,
                default: null
            }
        },
        validPeriod: {
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