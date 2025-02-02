var express = require("express");
var router = express.Router();
const multer = require("multer");
const path = require("path");
const sjcl = require("sjcl");
const { getAllItems } = require("../controllers/InventoryCtrls");

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

router.get("/getItems", getAllItems);

module.exports = { router};