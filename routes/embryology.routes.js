const express = require("express");
const { savePreExistingConditions, getPreExistingConditions, saveAllergies, getAllergies, saveChiefComplaints, getChiefComplaints, saveInfertility, getInfertility, saveExamination, getExaminations } = require("../controllers/EmbryologyController");
const router = express.Router();

router.get("/patient-emr", (req, res) => {
  res.render("Embryology/EMR/EMR");
});

router.get("/counselling",(req,res)=>{
  res.render("Embryology/counselling",{title:"Counselling"});
});

router.get("/consent", (req, res) => {
  res.render("Embryology/consent",{title:"Consent"});
});


router.post("/savePreExisting", savePreExistingConditions)
router.get("/getPreExisting", getPreExistingConditions);

router.post("/saveAllergies", saveAllergies);
router.get("/getAllergies", getAllergies);

router.post("/saveChiefComplaints", saveChiefComplaints);
router.get("/getChiefComplaints", getChiefComplaints);

router.post("/saveInfertility", saveInfertility);
router.get("/getInfertility", getInfertility);

router.post("/examination", saveExamination);
router.get("/examination", getExaminations);



module.exports = { router };

