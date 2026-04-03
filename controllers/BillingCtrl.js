const { Bill, AdvanceTransaction } = require("../models/BillingSchema");
const sjcl = require("sjcl");
const { Patient } = require("../models/HisSchema");

const secretKey = 'his'
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

exports.createBill = async (req, res) => {
    console.log(req.body)
    try {
        const clinicId = req.user.clinic_id;
        const username = req.user.username;

        if (!clinicId || !username) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID and username are required." });
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
            modeOfPayment,
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
            clinic_id: clinicId,
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
            modeOfPayment: modeOfPayment || null,
            doctor,
            create_by: username
        });
        const encBillId = encryptDataForUrl(newBill.id.toString())
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
    try {
        console.log(req.params)


        const { id } = req.params;
        const clinicId = req.user.clinic_id;
        const username = req.user.username;

        if (!clinicId || !username) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID and username are required." });
        }

        if (!id) {
            return res.status(400).json({ message: "Bill ID is required." });
        }
        const decId = decryptData(id);
        console.log(decId)
        const bill = await Bill.findOne({
            where: { id: decId, clinic_id: clinicId }
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
        const clinicId = req.user.clinic_id;
        const username = req.user.username;

        if (!clinicId || !username) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID and username are required." });
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

exports.getPatientsWithAdvance = async (req, res) => {
    try {

        const clinicId = req.user.clinic_id;
        const username = req.user.username;

        if (!clinicId || !username) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID and username are required." });
        }
        let page = Math.max(1, parseInt(req.query.page, 10) || 1);
        let limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
        const offset = (page - 1) * limit;

        const { name = "", email = "", mobile = "" } = req.query;

        const where = { clinic_id: req.user.clinic_id };


        if (name.trim()) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${name.trim()}%` } },
                { middleName: { [Op.like]: `%${name.trim()}%` } },
                { lastName: { [Op.like]: `%${name.trim()}%` } }
            ];
        }

        if (email.trim()) {
            where.email = { [Op.like]: `%${email.trim()}%` };
        }

        if (mobile.trim()) {
            where.mobile = { [Op.like]: `%${mobile.trim()}%` };
        }


        const { rows: patients, count: totalPatients } =
            await Patient.findAndCountAll({
                where,
                attributes: [
                    "id",
                    "lead_id",
                    "uhid",
                    "prefix",
                    "firstName",
                    "middleName",
                    "lastName",
                    "email",
                    "mobile",
                    "patientImage"
                ],
                order: [["id", "DESC"]],
                limit,
                offset
            });


        const patientsWithAdvance = await Promise.all(
            patients.map(async (p) => {

                const latestAdvance = await AdvanceTransaction.findOne({
                    where: { patientId: p.id },
                    order: [["createdAt", "DESC"]],
                    attributes: ["balanceAfter"]
                });


                const fullName = [
                    p.prefix,
                    p.firstName,
                    p.middleName,
                    p.lastName
                ].filter(Boolean).join(" ");

                return {
                    id: p.id,
                    lead_id: p.lead_id,
                    uhid: p.uhid,
                    name: fullName,
                    email: p.email,
                    mobile: p.mobile,
                    patientImage: p.patientImage,
                    advance: latestAdvance ? latestAdvance.balanceAfter : 0
                };
            })
        );

        return res.json({
            success: true,
            patients: patientsWithAdvance,
            pagination: {
                totalPatients,
                totalPages: Math.ceil(totalPatients / limit),
                currentPage: page,
                perPage: limit
            }
        });

    } catch (error) {
        console.error("Error fetching patients with advance:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.getPatientAdvanceById = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;
        const username = req.user.username;

        if (!clinicId || !username) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID and username are required." });
        }
        const patient = await Patient.findOne({
            where: {
                id,
                clinic_id: req.user.clinic_id
            },
            attributes: [
                "id",
                "uhid",
                "prefix",
                "firstName",
                "middleName",
                "lastName",
                "mobile"
            ]
        });

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: "Patient not found"
            });
        }

        const transactions = await AdvanceTransaction.findAll({
            where: { patientId: id },
            order: [["createdAt", "DESC"]]
        });

        const latest = transactions.length ? transactions[0].balanceAfter : 0;

        const fullName = [
            patient.prefix,
            patient.firstName,
            patient.middleName,
            patient.lastName
        ].filter(Boolean).join(" ");

        return res.json({
            success: true,
            id: patient.id,
            uhid: patient.uhid,
            name: fullName,
            mobile: patient.mobile,
            advance: latest,
            transactions
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.addAdvance = async (req, res) => {
    try {

        const { patientId, amount, modeOfPayment, remark } = req.body;

        const clinicId = req.user.clinic_id;
        const username = req.user.username;

        if (!clinicId || !username) {
            return res.status(403).json({ message: "Unauthorized: Clinic ID and username are required." });
        }

        if (!patientId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid data"
            });
        }

        const lastTxn = await AdvanceTransaction.findOne({
            where: { patientId },
            order: [["createdAt", "DESC"]],
            attributes: ["balanceAfter"]
        });

        const prevBalance = lastTxn ? parseFloat(lastTxn.balanceAfter) : 0;
        const newBalance = prevBalance + parseFloat(amount);

        const txn = await AdvanceTransaction.create({
            clinic_id: req.user.clinic_id,
            patientId,
            billId: null,
            type: "CREDIT",
            amount,
            balanceAfter: newBalance,
            modeOfPayment,
            remark,
            created_by: username
        });

        return res.json({
            success: true,
            message: "Advance added successfully",
            data: txn
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.getPatientDetailsForBill = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    const { uhid, mobile, email } = req.query;

    if (!uhid && !mobile && !email) {
      return res.status(404).json({ message: "No search value provided" });
    }

    let whereClause = { clinic_id: clinicId };

    if (uhid) whereClause.uhid = uhid;
    if (mobile) whereClause.mobile = mobile;
    if (email) whereClause.email = email;

    let patient = await Patient.findOne({ where: whereClause });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const latestAdvance = await AdvanceTransaction.findOne({
      where: { patientId: patient.id },
      order: [["createdAt", "DESC"]],
      attributes: ["balanceAfter"]
    });

    const advance = latestAdvance ? parseFloat(latestAdvance.balanceAfter) : 0;

    return res.json({
      ...patient.toJSON(),
      advance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};