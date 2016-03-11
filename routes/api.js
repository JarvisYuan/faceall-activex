var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var SchemaApi = require('./api/schema_api');

/* GET home page. */
router.post('/face/register', function(req, res, next) {
});

router.use('/place', new SchemaApi(require('../lib/models/place')(mongoose)));

module.exports = router;