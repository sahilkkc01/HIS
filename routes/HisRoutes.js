var express = require('express');
var router = express.Router();
const multer = require('multer');
const path = require('path');
const jwt = require("jsonwebtoken");
const JWT_SECRET = "Sahilkkc01";
const { savePatientData, login, saveClinicData, logout, logoutFromEverywhere } = require('../controllers/HisControllers');
const { UserTokens } = require('../models/HisSchema');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/MyUploads')); 
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  }
});
const upload = multer({ storage: storage });


router.get("/login", async (req, res) => {
  const token = req.cookies.token; // Retrieve the JWT token from cookies

  if (token) {
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserTokens.findOne({ where: { jwtToken: token } });
      console.log(user)
      if (user) {
        return res.redirect("/Patient-Registration");
      } else {
        return res.render("HIS/login");
      }
      // If the token is valid, redirect to home
    } catch (err) {
      console.error("Invalid token", err);
      // If token verification fails, continue to render login
    }
  }

  // If no valid token is found, render the login page
  res.render("HIS/login");
});


router.get('/Patient-Registration', function(req, res, next) {
  res.render('HIS/patient-registration')
});
router.get('/PatientQrReg', function(req, res, next) {
  res.render('HIS/PatientQrReg')
});
router.get('/Doctor-Registration', function(req, res, next) {
  res.render('HIS/doctor-registration')
});
router.get('/Patient-List', function(req, res, next) {
  res.render('HIS/list-of-patients')
});
router.get('/Hospital-Registration', function(req, res, next) {
  res.render('HIS/hospital-registration')
});
router.get('/calender', function(req, res, next) {
  res.render('HIS/calender')
});





router.post('/login',login)
router.post('/logout',logout)
router.post('/logoutFromEverywhere',logoutFromEverywhere)
router.post('/patient-reg',upload.single('patientImage'),savePatientData)
router.post('/hospital-reg', 
  upload.fields([
      { name: 'logo', maxCount: 1 },
      { name: 'header_image', maxCount: 1 },
      { name: 'footer_image', maxCount: 1 }
  ]), 
  saveClinicData
);


module.exports = router;
