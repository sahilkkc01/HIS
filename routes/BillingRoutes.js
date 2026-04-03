var express = require("express");
const { createBill, getBillById, getAllBills, getPatientsWithAdvance, getPatientAdvanceById, addAdvance, getPatientDetailsForBill } = require("../controllers/BillingCtrl");
var router = express.Router();

router.get("/bill", function (req, res, next) {
    res.render("Billling/Bill");
  });
router.get("/bill-list", function (req, res, next) {
    res.render("Billling/BillList");
  });
router.get("/PrintBill", function (req, res, next) {
  const { id } = req.query;
  console.log(id);
    res.render("Billling/PrintBill",{billId:id});
  });


  router.get("/advanceProfile", function (req, res, next) {
    res.render("Billling/AdvanceProfile");
  });
  router.get("/advanceTransactions", function (req, res, next) {
    res.render("Billling/AdvanceTransaction");
  });

router.get("/getPatientDetailsForBill", getPatientDetailsForBill);
router.post("/generateBill",createBill)
router.get("/getBill/:id",getBillById)
router.get("/getBills",getAllBills)

router.get("/getPatientsWithAdvance", getPatientsWithAdvance)
router.get("/getPatientAdvanceById/:id",  getPatientAdvanceById);
router.post("/addAdvance",  addAdvance);
module.exports = { router};  