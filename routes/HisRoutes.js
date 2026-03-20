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
  PatientFilter,
  getPatientsWithLatestAppointment,
  getAllDoctors,
  getDoctorById,
  searchMedicine,
  saveEmr,
  saveClinic,
  getClinics,
  getClinicById,
  updateClinic,
  saveSource,
  getSources,
  getSourceById,
  updateSource,
  getMasterAdmin,
  getDoctors,
  updateDoctor,
  saveDoctor,
  saveTreatment,
  getTreatments,
  getTreatmentById,
  updateTreatment,
  saveCounselor,
  getCounselors,
  getCounselorById,
  getPatientById,
} = require("../controllers/HisControllers");
const { UserTokens, Patient } = require("../models/HisSchema");
const { updateAgent } = require("../controllers/CrmCtrl");



const secretKey='his'
// Encryption function
function encryptDataForUrl(data) {
  // Encrypt data with the secret key
  const encrypted = sjcl.encrypt(secretKey, data);

  // Base64-encode the encrypted JSON string for URL safety
  return encodeURIComponent(btoa(encrypted));
}

// Decryption function
function decryptData(encodedEncryptedData) {
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
        return res.redirect("/crm/leads");
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
router.get("/", (req, res) => {
  res.redirect("/crm/leads");
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
      patient.id=id;
    }

    res.render("HIS/patient-registration", { patient, encClinicId });
  } catch (error) {
    console.error("Error in Patient Registration:", error);
    res.status(500).send({ msg: "Internal Server Error" });
  }
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
  console.log(req.query)
  const id=req.query.Id;
  res.render("HIS/add-item",{id});
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
router.get("/add-prefix", function (req, res, next) {
  res.render("HIS/add-prefix");
});
router.get("/emr", function (req, res, next) {
  res.render("HIS/emr");
});

router.get("/clinic", function (req, res, next) {
  res.render("HIS/ClinicMaster");
});
router.post('/clinics/create',  saveClinic);
router.get('/clinics/list', getClinics);
router.get('/getClinicById/:id', getClinicById);
router.post('/clinics/update/:id', updateClinic);

router.get("/source", function (req, res, next) {
  res.render("HIS/SourceMaster");
});
router.post('/sources/create',  saveSource);
router.get('/sources/list', getSources);
router.get('/getSourcesById/:id', getSourceById);
router.post('/sources/update/:id', updateSource);

router.get("/doctors", function (req, res, next) {
  res.render("HIS/DoctorMaster");
});
router.post('/doctors/create',  saveDoctor);
router.get('/doctors/list', getDoctors);
router.get('/getDoctorById/:id', getDoctorById);
router.post('/doctors/update/:id', updateDoctor);

router.get("/counselors", function (req, res, next) {
  res.render("HIS/CounselorMaster");
});
router.post('/counselors/create',  saveCounselor);
router.get('/counselors/list', getCounselors);
router.get('/getCounselorsById/:id', getCounselorById);
router.post('/counselors/update/:id', updateAgent);

router.get("/treatments", function (req, res, next) {
  res.render("HIS/TreatmentMaster");
});
router.post('/treatments/create',  saveTreatment);
router.get('/treatments/list', getTreatments);
router.get('/getTreatmentsById/:id', getTreatmentById);
router.post('/treatments/update/:id', updateTreatment);


// Put all render routes above this
router.get('/getMasterAdmin',getMasterAdmin);
router.post("/login", login);
router.post("/logout", logout);
router.post("/logoutFromEverywhere", logoutFromEverywhere);
// router.post("/patient/save ", upload.single("patientImage"), savePatientData);
// router.post("/doctor-reg", upload.single("doctorImage"), saveDoctorData);

//test
router.post("/patient/save", upload.fields([
  { name: "patientImage", maxCount: 1 },
  { name: "spouseImage", maxCount: 1 }
]), savePatientData);

//test2
const { verifyToken } = require("../controllers/HisControllers");

router.post(
  "/patient/save",
  verifyToken,
  upload.fields([
    { name: "patientImage", maxCount: 1 },
    { name: "spouseImage", maxCount: 1 }
  ]),
  savePatientData
);
router.get("/getPatientById", getPatientById);




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
router.get("/patients-with-appointments",getPatientsWithLatestAppointment);
router.post("/getAvailableSlots", getAvailableSlots);
router.get("/patient/:patientId", getPatientData);
router.get("/patientFilter", PatientFilter);
router.get("/getDoctorAppointments", getDoctorAppointments);

router.post("/save-item", upload.single("itemImage"), saveItems);
router.post("/save-service", saveService);
router.post("/save-package", savePackage);
router.post("/addModal", addNewModal);
router.get("/getdoctors", getAllDoctors);
router.get("/getdoctorbyid", getDoctorById);
router.get('/searchMedicine',  searchMedicine);
router.post('/saveemr', saveEmr);

module.exports = { router, upload };
