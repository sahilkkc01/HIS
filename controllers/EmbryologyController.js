const path = require("path");
const { PreExistingCondition, Allergy, ChiefComplaint, InfertilityHistory } = require("../models/EmbryologySchema");

exports.savePreExistingConditions = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const createdBy = req.user?.username;

  if (!clinicId) {
    return res.status(400).json({ message: "Please login" });
  }

  try {
    const { patientId, conditions } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID required" });
    }

    if (!Array.isArray(conditions) || conditions.length === 0) {
      return res.status(400).json({ message: "Conditions required" });
    }

    // delete old
    await PreExistingCondition.destroy({
      where: {
        patient_id: patientId,
        clinic_id: clinicId
      }
    });

    // prepare data
    const data = conditions
      .filter(c => c.condition)
      .map(c => ({
        clinic_id: clinicId,
        patient_id: patientId,
        condition_name: c.condition,
        since: c.since || null,
        created_by: createdBy || "system"
      }));

    // insert
    const saved = await PreExistingCondition.bulkCreate(data);

    return res.json({
      success: true,
      message: "Conditions saved successfully",
      data: saved
    });

  } catch (error) {
    console.error("Error saving conditions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save conditions"
    });
  }
};

exports.getPreExistingConditions = async (req, res) => {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) {
    return res.status(400).json({ message: "Please login" });
  }

  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID required" });
    }

    const conditions = await PreExistingCondition.findAll({
      where: {
        patient_id: patientId,
        clinic_id: clinicId
      },
      order: [["id", "DESC"]]
    });

    return res.json({
      success: true,
      data: conditions
    });

  } catch (error) {
    console.error("Error fetching conditions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conditions"
    });
  }
};

exports.saveAllergies = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const createdBy = req.user?.username;

  if (!clinicId) {
    return res.status(400).json({ message: "Please login" });
  }

  try {
    const { patientId, allergies } = req.body;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID required" });
    }

    // delete old
    await Allergy.destroy({
      where: { patient_id: patientId, clinic_id: clinicId }
    });

    // insert new
    if (Array.isArray(allergies) && allergies.length > 0) {
      const payload = allergies.map(a => ({
        clinic_id: clinicId,
        patient_id: patientId,
        allergy_name: a.allergy,
        severity: a.severity || null,
        created_by: createdBy
      }));

      await Allergy.bulkCreate(payload);
    }

    return res.json({
      success: true,
      message: "Allergies saved successfully"
    });

  } catch (error) {
    console.error("Save allergy error:", error);
    return res.status(500).json({ message: "Error saving allergies" });
  }
};

exports.getAllergies = async (req, res) => {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) {
    return res.status(400).json({ message: "Please login" });
  }

  try {
    const { patientId } = req.query;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID required" });
    }

    const data = await Allergy.findAll({
      where: {
        patient_id: patientId,
        clinic_id: clinicId
      },
      attributes: ["id", "allergy_name", "severity"],
      order: [["id", "DESC"]]
    });

    return res.json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Fetch allergy error:", error);
    return res.status(500).json({ message: "Error fetching allergies" });
  }
};

exports.saveChiefComplaints = async (req, res) => {

  const clinicId = req.user?.clinic_id;
  const createdBy = req.user?.username;

  try {
    const { patientId, complaints } = req.body;

    await ChiefComplaint.destroy({
      where: { patient_id: patientId, clinic_id: clinicId }
    });

    if (complaints?.length) {
      const payload = complaints.map(c => ({
        clinic_id: clinicId,
        patient_id: patientId,
        description: c.description,
        duration: c.duration,
        severity: c.severity,
        onset: c.onset || null,
        status: c.status,
        created_by: createdBy
      }));

      await ChiefComplaint.bulkCreate(payload);
    }

    res.json({ success: true, message: "Saved successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error saving" });
  }
};

exports.getChiefComplaints = async (req, res) => {

  const clinicId = req.user?.clinic_id;

  try {
    const { patientId } = req.query;

    const data = await ChiefComplaint.findAll({
      where: {
        patient_id: patientId,
        clinic_id: clinicId
      },
      order: [["id", "DESC"]]
    });

    res.json({ success: true, data });

  } catch (err) {
    res.status(500).json({ message: "Error fetching" });
  }
};

exports.saveInfertility = async (req, res) => {

  const clinicId = req.user.clinic_id;
  const createdBy = req.user.username;

  const { patientId, ...data } = req.body;

  let existing = await InfertilityHistory.findOne({
    where: { patient_id: patientId, clinic_id: clinicId }
  });

  if (existing) {
    await existing.update(data);
  } else {
    await InfertilityHistory.create({
      clinic_id: clinicId,
      patient_id: patientId,
      created_by: createdBy,
      ...data
    });
  }

  res.json({ success: true });
};

exports.getInfertility = async (req, res) => {

  const clinicId = req.user.clinic_id;
  const { patientId } = req.query;

  const data = await InfertilityHistory.findOne({
    where: { patient_id: patientId, clinic_id: clinicId }
  });

  res.json({ success: true, data });
};