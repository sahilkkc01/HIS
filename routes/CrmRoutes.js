var express = require("express");
const multer = require("multer");
const path = require("path");
const { savePatientData, getPatientData, getAllPatients, saveFollowUp, getFollowupHistory, saveInteraction, getInteractionHistory, savePayment, getPaymentHistory, getDashboardData, saveLead, getLead, updateLead, getFollowUps, saveAppointment, getAppointments, updateAppointmentStatus, saveAndUpdateLeadAppointments, saveFollowUpUpdateLeadAppointment, getAllLeads, updateAptStatus, saveVisited, getVisiteds, saveVisitFollowUp, getFollowUpsForVisit, saveConverted, getConverted, saveDoctor, getDoctors, getAppointmentsByDoctor, getAppointmentById, cancelAppointment, getVisits, getConversions, getAllFollowUps, getAllAppointments, getCRMDashboardStats, getDoctorById, updateDoctor, getClinics, saveClinic, getClinicById, updateClinic, saveAgent, getAgents, getAgentById, updateAgent, saveCounselor, getCounselors, getCounselorById, saveTreatment, getTreatments, getTreatmentById, updateTreatment, saveSource, getSources, updateSource, getSourceById } = require("../controllers/CrmCtrl");

var router = express.Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "../public/MyUploads"));
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
    },
  });
  const upload = multer({ storage: storage });



router.get("/Dashboard", function (req, res, next) {
    res.render("CRM/Dashboard");
  });
router.get("/CreateUser", function (req, res, next) {
    res.render("CRM/createUsers");
  });
router.get("/Users", function (req, res, next) {
    res.render("CRM/Users");
  });
router.get("/CRM", function (req, res, next) {
    res.render("CRM/CRM");
  });
router.get("/Leads", function (req, res, next) {
    res.render("CRM/LeadList");
  });
router.get("/DocMaster", function (req, res, next) {
    res.render("CRM/DoctorMaster");
  });
router.get("/AptCalender", function (req, res, next) {
    res.render("CRM/AptCalender");
  });
router.get("/ClinicMaster", function (req, res, next) {
    res.render("CRM/ClinicMaster");
  });
 
 router.get("/AgentMaster", function (req, res, next) {
    res.render("CRM/AgentMaster");
  }); 
   router.get("/CounselorMaster", function (req, res, next) {
    res.render("CRM/CounselorMaster");
  }); 
router.get("/TreatmentMaster", function (req, res, next) {
    res.render("CRM/TreatmentMaster");
  }); 
router.get("/SourceMaster", function (req, res, next) {
    res.render("CRM/SourceMaster");
  }); 

router.post("/savePatient",savePatientData,);
router.get("/getAllPatients", getAllPatients);
router.get("/patients/:patientId",getPatientData);
router.post("/save-followup",saveFollowUp)
router.get("/followups/:patientId",getFollowupHistory)
router.post("/save-interaction",upload.single("document"),saveInteraction)
router.get("/interactions/:patientId",getInteractionHistory)
router.post("/save-payment",savePayment)
router.get("/payments/:patientId",getPaymentHistory)
// router.get("/dashboardData",getDashboardData)
// router.post("/createUser",createUser)
// router.get("/getUsers",getAllUsers)
// router.get('/getUserByid/:id', getUserById);
// router.post('/deleteUser', deleteUser);


router.post('/saveLead',saveLead)
router.post('/updateLead', updateLead);
router.get('/getlead/:patientId', getLead);
// router.get('/getMasterAdmin',getMasterAdmin);
router.post('/leadFollowUps',saveFollowUp);
router.get ('/leadFollowUps', getFollowUps);
router.post ('/leadAppointments', saveAppointment);
router.get('/appointments',getAppointmentsByDoctor);
router.get ('/leadAppointments', getAppointments);
router.put ('/leadAppointments/:id', updateAptStatus);
router.put('/saveAndUpdateLeadAppointments/:id',saveAndUpdateLeadAppointments);
router.put('/updatleadApptNewFolloup/:id',saveFollowUpUpdateLeadAppointment);
router.get('/getAllLeads',getAllLeads);
router.post('/leadVisiteds',saveVisited);
router.get('/leadVisiteds',getVisiteds);
router.post('/saveVisitfollowUp',saveVisitFollowUp);
router.get('/visitFollowUps',  getFollowUpsForVisit);
router.post('/saveConverted',  saveConverted);
router.get('/getConverted',  getConverted);

router.get('/leadAppointment/:id',getAppointmentById);
router.patch('/leadAppointment/:id/cancel',cancelAppointment);

router.get('/getAllfollowups', getAllFollowUps);
router.get('/getAllAppointments', getAllAppointments);

router.get('/visits', getVisits);
router.get('/conversions', getConversions);

router.get('/dashboardData',getCRMDashboardStats);



module.exports = { router};  