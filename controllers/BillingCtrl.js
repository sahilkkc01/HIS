const { Bill } = require("../models/BillingSchema");
const sjcl = require("sjcl");

const secretKey='his'
// Encryption function
function encryptDataForUrl(data) {
  // Encrypt data with the secret key
  const encrypted = sjcl.encrypt(secretKey, data);

  // Base64-encode the encrypted JSON string for URL safety
  return encodeURIComponent(btoa(encrypted));
}

// Decryption function
function decryptData(encodedEncryptedData) {
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

exports.createBill= async (req, res) => {
    console.log(req.body)
    try {
        const clinicId = req.user.clinic_id; // Get clinic ID from the logged-in user
        if (!clinicId) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID is required." });
        }

        const {
            patientId,
            patientName,
            patientGender,
            patientAge,
            patientMobile,
            items,
            discountCategory,
            discountValue,
            discountAmount,
            taxAmount,
            netAmount,
            remark,
            doctor
        } = req.body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: "Bill must have at least one item." });
        }
        if (!patientName) {
            return res.status(400).json({ message: "Please select a Patient." });
        }

        // Save bill
        const newBill = await Bill.create({
            clinic_id:clinicId, 
            patientId: patientId || null,
            patientName,
            patientGender: patientGender || null,
            patientAge: patientAge || null,
            patientMobile: patientMobile || null,
            items,
            discountCategory: discountCategory || null,
            discountValue: discountValue || 0.00,
            discountAmount: discountAmount || 0.00,
            taxAmount: taxAmount || 0.00,
            netAmount: netAmount || 0.00,
            remark: remark || null,
            doctor
        });
       const encBillId=encryptDataForUrl(newBill.id.toString())
        return res.status(201).json({
            message: "Bill created successfully",
            billId: encBillId
        });
    } catch (error) {
        console.error("Error saving bill:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.getBillById = async (req, res) => {
    try {console.log(req.params)
        const { id } = req.params;

        const clinicId = req.user.clinic_id; // Get clinic ID from the logged-in user
        if (!clinicId) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID is required." });
        }

        if (!id) {
            return res.status(400).json({ message: "Bill ID is required." });
        }
        const decId=decryptData(id);
        console.log(decId)
        const bill = await Bill.findOne({
            where: { id: decId,clinic_id:clinicId }
        });
console.log(bill)
        if (!bill) {
            return res.status(404).json({ message: "Bill not found." });
        }

        return res.status(200).json(bill);
    } catch (error) {
        console.error("Error fetching bill:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

exports.getAllBills = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id; // Get clinic ID from the logged-in user

        if (!clinicId) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID is required." });
        }

        const bills = await Bill.findAll({
            where: { clinic_id: clinicId },
            order: [['createdAt', 'DESC']]
        });

        const encryptedBills = bills.map(bill => ({
            ...bill.toJSON(),
            encryptedId: encryptDataForUrl(bill.id.toString())
        }));

        return res.status(200).json({ bills: encryptedBills });
    } catch (error) {
        console.error("Error fetching bills:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
