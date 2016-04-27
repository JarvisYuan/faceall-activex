var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var SchemaApi = require('./api/schema_api');

router.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
router.use('/place', new SchemaApi(require('../lib/models/place')(mongoose)));
router.use('/passport', require('./api/passport'));
router.use('/common', require('./api/common'));

module.exports = router;