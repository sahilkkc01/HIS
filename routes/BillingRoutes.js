var express = require("express");
const { createBill, getBillById, getAllBills } = require("../controllers/BillingCtrl");
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
router.post("/generateBill",createBill)
router.get("/getBill/:id",getBillById)
router.get("/getBills",getAllBills)
module.exports = { router};  