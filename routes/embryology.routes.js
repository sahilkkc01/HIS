/**
 * Embryology Module Routes
 * Purpose: Define all HTTP routes for the embryology department module
 * Base Path: /embryology (mounted in main app.js)
 * Controller: EmbryologyController handles all route logic
 */

const express = require("express");
const router = express.Router();

exports.getPatientEmr = (req, res) => {
  res.render("Embryology/patient-emr", { title: "Embryology - Patient EMR" });
};

exports.getCounselling = (req, res) => {
  res.render("Embryology/counselling", { title: "Embryology - Counselling" });
};

// GET: Render consent search form
exports.getConsent = (req, res) => {
  res.render("Embryology/consent", { title: "Embryology - Consent" });
};





// Import embryology controller methods
const EmbryologyController = require("../controllers/EmbryologyController");

// Prefix for these routes will be /embryology (mounted in app.js)

//TEST
router.get("/patient-emr", (req, res) => {
  res.render("Embryology/EMR/allergies");
});




// Patient counselling management routes  
router.get("/counselling", EmbryologyController.getCounselling);

// Patient consent management routes
router.get("/consent", EmbryologyController.getConsent);
router.post("/consent/search", EmbryologyController.searchPatients);
router.post("/consent/barcode", EmbryologyController.generateBarcode);

// Treatment cycle tracking routes
router.get("/cycle", EmbryologyController.getCycle);

// Embryology overview/dashboard routes
router.get("/overview", EmbryologyController.getOverview);

// Ovarian stimulation protocol routes
router.get("/stimulation", EmbryologyController.getStimulation);

// OPU (Oocyte Pick-Up) procedure routes
router.get("/opu", EmbryologyController.getOpu);

// Sperm processing and analysis routes
router.get("/sperm", EmbryologyController.getSperm);

// Embryo culture monitoring routes
router.get("/culture", EmbryologyController.getCulture);

// ET (Embryo Transfer) procedure routes
router.get("/et", EmbryologyController.getEt);

// Treatment outcome tracking routes
router.get("/outcome", EmbryologyController.getOutcome);




module.exports = { router };

