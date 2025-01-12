var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/Patient-Registration', function(req, res, next) {
  res.render('HIS/patient-registration')
});
router.get('/Doctor-Registration', function(req, res, next) {
  res.render('HIS/doctor-registration')
});
router.get('/Patient-List', function(req, res, next) {
  res.render('HIS/list-of-patients')
});

module.exports = router;
