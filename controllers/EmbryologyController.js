const path = require("path");
const { EmbryologyConsent, EmbryologyCycle } = require("../models/EmbryologySchema");
const { Patient } = require("../models/HisSchema");

// Simple render helpers following existing HIS/Billing patterns.
// Each handler renders its corresponding Embryology view.

exports.getPatientEmr = (req, res) => {
  res.render("Embryology/patient-emr", { title: "Embryology - Patient EMR" });
};

exports.getCounselling = (req, res) => {
  res.render("Embryology/counselling", { title: "Embryology - Counselling" });
};

// GET: Render consent search form
exports.getConsent = (req, res) => {
  res.render("Embryology/consent", { title: "Embryology - Consent" });
};

// POST: Handle patient search based on form filters
exports.searchPatients = async (req, res) => {
  try {
    // Extract search parameters from form
    const {
      uhid,
      idProof,
      firstName,
      lastName,
      gender,
      mobile,
      dob,
      age,
      visitedValue,
      visitedUnit
    } = req.body;

    // Build search conditions
    const whereConditions = {};
    
    if (uhid) whereConditions.uhid = { [require('sequelize').Op.like]: `%${uhid}%` };
    if (firstName) whereConditions.name = { [require('sequelize').Op.like]: `%${firstName}%` };
    if (lastName) whereConditions.name = { [require('sequelize').Op.like]: `%${lastName}%` };
    if (gender) whereConditions.gender = gender;
    if (mobile) whereConditions.mobile = { [require('sequelize').Op.like]: `%${mobile}%` };
    if (age) whereConditions.age = age;
    
    // Add date filtering for DOB if provided
    if (dob) {
      whereConditions.dob = dob;
    }
    
    // Add visit timeframe filtering
    if (visitedValue && visitedUnit) {
      const visitDate = new Date();
      switch (visitedUnit) {
        case 'days':
          visitDate.setDate(visitDate.getDate() - parseInt(visitedValue));
          break;
        case 'weeks':
          visitDate.setDate(visitDate.getDate() - (parseInt(visitedValue) * 7));
          break;
        case 'months':
          visitDate.setMonth(visitDate.getMonth() - parseInt(visitedValue));
          break;
        case 'years':
          visitDate.setFullYear(visitDate.getFullYear() - parseInt(visitedValue));
          break;
      }
      whereConditions.createdAt = {
        [require('sequelize').Op.gte]: visitDate
      };
    }

    // Search patients with conditions
    const patients = await Patient.findAll({
      where: whereConditions,
      attributes: [
        'id', 'uhid', 'name', 'dob', 'mobile', 'email', 'gender', 
        'age', 'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    // Format response data
    const formattedPatients = patients.map(patient => ({
      mrNo: patient.uhid || `MR${patient.id}`,
      name: patient.name,
      dateOfBirth: patient.dob,
      babyBirthWeight: "N/A", // This would come from delivery records
      registrationDate: patient.createdAt?.toISOString().split('T')[0],
      mobileNo: patient.mobile,
      email: patient.email || "N/A",
      gender: patient.gender,
      maritalStatus: "N/A", // This would come from patient details
      identityType: "N/A", // This would come from identity documents
      identityNumber: "N/A", // This would come from identity documents
      specialRegistration: "No",
      registeredFrom: "Hospital"
    }));

    // Return JSON response for AJAX requests
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ success: true, patients: formattedPatients });
    } else {
      // Render view with data for regular form submission
      res.render("Embryology/consent", { 
        title: "Embryology - Consent", 
        patients: formattedPatients,
        searchParams: req.body 
      });
    }
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching patients',
      error: error.message 
    });
  }
};

// POST: Generate barcode for patient
exports.generateBarcode = async (req, res) => {
  try {
    const { uhid } = req.body;
    
    if (!uhid) {
      return res.status(400).json({ 
        success: false, 
        message: 'UHID is required' 
      });
    }

    // Find patient
    const patient = await Patient.findOne({ where: { uhid } });
    
    if (!patient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Patient not found' 
      });
    }

    // Generate unique barcode
    const barcode = `EMB-${uhid}-${Date.now()}`;
    
    // Create or update consent record with barcode
    await EmbryologyConsent.upsert({
      patient_id: patient.id,
      uhid: uhid,
      barcode: barcode,
      consent_type: 'IVF_CONSENT',
      consent_status: 'PENDING'
    });

    res.json({ 
      success: true, 
      barcodeData: {
        uhid: uhid,
        barcode: barcode,
        generatedAt: new Date(),
        patientName: patient.name
      }
    });
  } catch (error) {
    console.error('Error generating barcode:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating barcode',
      error: error.message 
    });
  }
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

