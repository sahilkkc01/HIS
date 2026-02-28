const path = require("path");

// Simple render helpers following existing HIS/Billing patterns.
// Each handler renders its corresponding Embryology view.

exports.getPatientEmr = (req, res) => {
  res.render("Embryology/patient-emr", { title: "Embryology - Patient EMR" });
};

exports.getCounselling = (req, res) => {
  res.render("Embryology/counselling", { title: "Embryology - Counselling" });
};

exports.getConsent = (req, res) => {
  res.render("Embryology/consent", { title: "Embryology - Consent" });
};

exports.getCycle = (req, res) => {
  res.render("Embryology/cycle", { title: "Embryology - Cycle" });
};

exports.getOverview = (req, res) => {
  res.render("Embryology/overview", { title: "Embryology - Overview" });
};

exports.getStimulation = (req, res) => {
  res.render("Embryology/stimulation", { title: "Embryology - Stimulation" });
};

exports.getOpu = (req, res) => {
  res.render("Embryology/opu", { title: "Embryology - OPU" });
};

exports.getSperm = (req, res) => {
  res.render("Embryology/sperm", { title: "Embryology - Sperm" });
};

exports.getCulture = (req, res) => {
  res.render("Embryology/culture", { title: "Embryology - Culture" });
};

exports.getEt = (req, res) => {
  res.render("Embryology/et", { title: "Embryology - ET" });
};

exports.getOutcome = (req, res) => {
  res.render("Embryology/outcome", { title: "Embryology - Outcome" });
};

