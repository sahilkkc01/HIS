var express = require("express");
var router = express.Router();
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const sjcl = require("sjcl");
const JWT_SECRET = "Sahilkkc01";
const {
  savePatientData,
  login,
  saveClinicData,
  logout,
  logoutFromEverywhere,
  saveDoctorData,
  addSpecialization,
  getDataFromField,
  getAvailableSlots,
  getAllPatientsWithLatestAppointment,
  getPatientData,
  getDoctorAppointments,
  saveItems,
  saveService,
  savePackage,
  addDepartment,
  saveEmployeeData,
  addNewModal,
} = require("../controllers/HisControllers");
const { UserTokens, Patient } = require("../models/HisSchema");

// Encryption function
function encryptDataForUrl(data) {
  // Encrypt data with the secret key
  const encrypted = sjcl.encrypt("his", data);

  // Base64-encode the encrypted JSON string for URL safety
  return encodeURIComponent(btoa(encrypted));
}
// Decryption function
function decryptData(encodedEncryptedData, secretKey) {
  try {
    // Decode the Base64-encoded data from the URL
    const encryptedData = atob(decodeURIComponent(encodedEncryptedData));

    // Decrypt using SJCL and return the result
    return sjcl.decrypt(secretKey, encryptedData);
  } catch (error) {
    console.error("Decryption error:", error.message);
    return null; // Handle or return as needed
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/MyUploads"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
  },
});
const upload = multer({ storage: storage });

router.get("/login", async (req, res) => {
  const token = req.cookies.token; // Retrieve the JWT token from cookies

  if (token) {
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserTokens.findOne({ where: { jwtToken: token } });
      console.log(user);
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

router.get("/Patient-Registration", async function (req, res, next) {
  try {
    const { id } = req.query;
    console.log(id);
    
    let patient = {};
    const clinicId = req.user?.clinic_id; // Get clinic_id from session

    if (!clinicId) {
      return res.status(400).send({ msg: "Please login" });
    }
    const encClinicId = encryptDataForUrl(clinicId.toString());
    if (id) {
      const decryptedId = decryptData(decodeURIComponent(id), "his");
      console.log(decryptedId);

      const data = await Patient.findByPk(decryptedId);
      patient = data ? data.get({ plain: true }) : {};
    }

    res.render("HIS/patient-registration", { patient, encClinicId });
  } catch (error) {
    console.error("Error in Patient Registration:", error);
    res.status(500).send({ msg: "Internal Server Error" });
  }
});

router.get("/PatientQrReg", function (req, res, next) {
  res.render("HIS/PatientQrReg");
});
router.get("/Doctor-Registration", function (req, res, next) {
  const clinicId = req.user?.clinic_id; // Get clinic_id from session

  if (!clinicId) {
    return res.status(400).send({ msg: "Please login" });
  }
  const encClinicId = encryptDataForUrl(clinicId.toString());
  res.render("HIS/doctor-registration",{encClinicId});
});
router.get("/Patient-List", function (req, res, next) {
  res.render("HIS/list-of-patients");
});
router.get("/Hospital-Registration", function (req, res, next) {
  res.render("HIS/hospital-registration");
});
router.get("/calender", function (req, res, next) {
  res.render("HIS/calender");
});

router.get("/add-item", function (req, res, next) {
  res.render("HIS/add-item");
});

router.get("/add-package", function (req, res, next) {
  res.render("HIS/add-package");
});

router.get("/add-service", function (req, res, next) {
  res.render("HIS/add-services");
});
router.get("/add-employee", function (req, res, next) {
  res.render("HIS/add-employee");
});
router.get("/purchase-order", function (req, res, next) {
  res.render("HIS/PurchaseOrder");
});
router.get("/indent", function (req, res, next) {
  res.render("HIS/Indent");
});

// Put all render routes above this
router.post("/login", login);
router.post("/logout", logout);
router.post("/logoutFromEverywhere", logoutFromEverywhere);
router.post("/patient-reg", upload.single("patientImage"), savePatientData);
router.post("/doctor-reg", upload.single("doctorImage"), saveDoctorData);
router.post("/emp-reg", upload.single("empImage"), saveEmployeeData);
router.post(
  "/hospital-reg",
  upload.fields([
    { name: "logo", maxCount: 1 },
    { name: "header_image", maxCount: 1 },
    { name: "footer_image", maxCount: 1 },
  ]),
  saveClinicData
);
router.post("/addSpec", addSpecialization);
router.post("/addDept", addDepartment);
router.get("/getDataFromField", getDataFromField);
router.get("/patients-with-appointments", getAllPatientsWithLatestAppointment);
router.post("/getAvailableSlots", getAvailableSlots);
router.get("/patient/:patientId", getPatientData);
router.get("/getDoctorAppointments", getDoctorAppointments);

router.post("/save-item", upload.single("itemImage"), saveItems);
router.post("/save-service", saveService);
router.post("/save-package", savePackage);
router.post("/addModal", addNewModal);

module.exports = router;
