var express = require("express");
var router = express.Router();
const multer = require("multer");
const path = require("path");
const sjcl = require("sjcl");
const { getAllItems, createGRN, createIndent, getAllGRNs, getAllIndents, getItemById, approveGrn, rejectGrn, getCurrentStock, getStockTransaction, savePo, createPO, getAllPOs, approvePo, rejectPo, getIndentsByStore, approveIndent, rejectIndent, getPOsByStore } = require("../controllers/InventoryCtrls");

// Encryption function
function encryptDataForUrl(data) {
  // Encrypt data with the secret key
  const encrypted = sjcl.encrypt("his", data);

  // Base64-encode the encrypted JSON string for URL safety
  return encodeURIComponent(btoa(encrypted));
}
// Decryption function
function decryptData(encodedEncryptedData, secretKey) {
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


router.get("/indent", function (req, res, next) {
    res.render("Inventory/Indent");
  });
router.get("/grn", function (req, res, next) {
    res.render("Inventory/GRN");
  });
router.get("/grn-list", function (req, res, next) {
    res.render("Inventory/GRNList");
  });
router.get("/indent-list", function (req, res, next) {
    res.render("Inventory/IndentList");
  });
router.get("/item-list", function (req, res, next) {
    res.render("Inventory/ItemList");
  });
router.get("/approve-grn", function (req, res, next) {
    res.render("Inventory/ApproveGrn");
  });
router.get("/Current-item-stock", function (req, res, next) {
    res.render("Inventory/CurrentItemStock");
  });
router.get("/stock-transaction", function (req, res, next) {
    res.render("Inventory/stockTransaction");
  });
router.get("/purchase-order", function (req, res, next) {
    res.render("Inventory/PurchaseOrder");
  });
router.get("/po-list", function (req, res, next) {
    res.render("Inventory/PoList");
  });
router.get("/approve-po", function (req, res, next) {
    res.render("Inventory/ApprovePO");
  });
router.get("/approve-indent", function (req, res, next) {
    res.render("Inventory/ApproveIndent");
  });

router.get("/getItems", getAllItems);
router.get("/getCurrentStock", getCurrentStock);
router.get("/getAllStockTransactions", getStockTransaction);
router.get("/getItem/:id", getItemById);
router.get("/getAllGrn", getAllGRNs);
router.get("/getAllPo", getAllPOs);
router.get("/getAllIndents", getAllIndents);
router.post('/SaveGrn',createGRN)
router.post('/SavePurchaseOrder',createPO)
router.post('/SaveIndent',createIndent)
router.post('/approveGrn/:grnId',approveGrn)
router.post('/rejectGrn/:grnId',rejectGrn)
router.post("/approvePo/:poId", approvePo);
router.post("/rejectPo/:poId", rejectPo);
router.post("/approveIndent/:indentId", approveIndent);
router.post("/rejectIndent/:indentId", rejectIndent);
router.get("/getIndentsByStore/:store", getIndentsByStore);
router.get("/getPOsByStore/:store", getPOsByStore);


module.exports = { router};