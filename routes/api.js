var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var SchemaApi = require('./api/schema_api');

router.use('/place', new SchemaApi(require('../lib/models/place')(mongoose)));
router.use('/passport', require('./api/passport'));

module.exports = router;