var express = require("express");
const { createBill, getBillById, getAllBills, getPatientsWithAdvance, getPatientAdvanceById, addAdvance, getPatientDetailsForBill, createServiceBill, getServiceBillById, getAllServiceBills } = require("../controllers/BillingCtrl");
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

router.get("/PrintServiceBill", function (req, res, next) {
  const { id } = req.query;
  console.log(id);
    res.render("Billling/PrintServiceBill",{billId:id});
  });


  router.get("/ServiceBill", function (req, res, next) {
    res.render("Billling/ServiceBill");
  });

  router.get("/serviceBillList", function (req, res, next) {
    res.render("Billling/ServiceBillList");
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

router.post("/generateServiceBill", createServiceBill)
router.get("/getServiceBill/:id", getServiceBillById)
router.get("/getServiceBills", getAllServiceBills)


router.get("/getPatientsWithAdvance", getPatientsWithAdvance)
router.get("/getPatientAdvanceById/:id",  getPatientAdvanceById);
router.post("/addAdvance",  addAdvance);
module.exports = { router};  