const express = require("express");
const router = express.Router();

router.get("/patient-emr", (req, res) => {
  res.render("Embryology/EMR/allergies");
});

router.get("/counselling",(req,res)=>{
  res.render("Embryology/counselling",{title:"Counselling"});
});

router.get("/consent", (req, res) => {
  res.render("Embryology/consent",{title:"Consent"});
});


module.exports = { router };

