const express = require("express");
var router = express.Router();

const ociController = require('../controllers/oci-controller');

router.get('/file/:bucket/:name',ociController.getFileFromBucket);


module.exports = router;