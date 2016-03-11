var express = require('express');
var router = express.Router();
require('../../lib/utils');

module.exports = function(model, opts) {

    opts = extend(opts, {
        "listCallback": function(items, req, res, next) {
            res.send(items);
        },
        "fetchCallback": function(item, req, res, next) {
            if (item) res.send(item);
            else res.sendStatus(404);
        },
        "insertCallback": function(item, req, res, next) {
            if (item) res.send(item);
            else res.sendStatus(500);
        },
        "removeCallback": function(item, req, res, next) {
            if (item) res.send(item);
            else res.sendStatus(500);
        },
        "updateCallback": function(item, req, res, next) {
            if (item) res.send(item);
            else res.sendStatus(500);
        }
    });

    /* list */
    router.get('/', function(req, res, next) {
        var qSkip = req.query.skip;
        var qTake = req.query.take;
        var qSort = req.query.sort;
        var qFilter = req.query.filter;
        return model.find().sort(qSort).skip(qSkip).limit(qTake)
        .exec(function (err, items) {
            if (err) {
                console.error('An error occured.', err);
                res.sendStatus(500);
            } else {
                opts.listCallback && opts.listCallback(items, req, res, next);
            }
        });
    });

    router.post('/', function (req, res, next) {
        if (req.body._id) delete req.body._id; // to ensure no preserved field _id in structure
        var item = new model(req.body);
        return item.save(function (err) {
            if (err) {
                console.error('An error occured.', err);
                res.sendStatus(500);
            } else {
                opts.insertCallback && opts.insertCallback(item, req, res, next);
            }
        });
    });

    router.get('/:id', function (req, res, next) {
        return model.findById(req.params.id, function (err, item) {
            if (err) {
                console.error('An error occured.', err);
                res.sendStatus(500);
            } else {
                opts.fetchCallback && opts.fetchCallback(item, req, res, next);
            }
        });
    });

    router.put('/:id', function (req, res, next) {
        if (req.body._id) delete req.body._id; // to ensure no preserved field _id in structure
        return model.findOneAndUpdate({ _id: req.params.id }, { $set: req.body}, null, function (err, item) {
            if (err) {
                console.error('An error occured.', err);
                res.sendStatus(500);
            } else {
                opts.updateCallback && opts.updateCallback(item, req, res, next);
            }
        });
    });

    router.delete('/:id', function (req, res, next) {
        return model.remove({ _id: req.params.id }, function (err, item) {
            if (err) {
                console.error('An error occured.', err);
                res.sendStatus(500);
            } else {
                opts.removeCallback && opts.removeCallback(item, req, res, next);
            }
        });
    });

    return router;
};