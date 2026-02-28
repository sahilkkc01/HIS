const express = require("express");
const router = express.Router();

const EmbryologyController = require("../controllers/EmbryologyController");

// Prefix for these routes will be /embryology (mounted in app.js)

router.get("/patient-emr", EmbryologyController.getPatientEmr);
router.get("/counselling", EmbryologyController.getCounselling);
router.get("/consent", EmbryologyController.getConsent);
router.get("/cycle", EmbryologyController.getCycle);
router.get("/overview", EmbryologyController.getOverview);
router.get("/stimulation", EmbryologyController.getStimulation);
router.get("/opu", EmbryologyController.getOpu);
router.get("/sperm", EmbryologyController.getSperm);
router.get("/culture", EmbryologyController.getCulture);
router.get("/et", EmbryologyController.getEt);
router.get("/outcome", EmbryologyController.getOutcome);

module.exports = { router };

