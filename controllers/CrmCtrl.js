
const { Op , fn, col, literal,} = require("sequelize");
const {sequelize} = require('../db.js')
const { Lead, LeadFollowUp, LeadAppointment, LeadVisited, VisitFollowup, LeadConverted, Doctor, Clinic, Agent, Counselor, Treatment, Source } = require("../models/CrmSchema.js");
const path = require('path');
const fs = require('fs');
// const { User } = require("../models/Auth.js");


exports.savePatientData = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const userId = req.user?.id;
  const username = req.user?.username;

  if (!clinicId || !userId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  try {
    const {
      id,
      reg_no,
      patient_name,
      spouse_name,
      number_1,
      number_2,
      email,
      opu_date,
      no_of_embryo_frozen,
      no_of_egg_frozen,
      remaining_embryo,
      remaining_egg,
      next_freezing_due_date,
      amount_due,
      amount_payable
    } = req.body;

    // required fields
    if (
      !reg_no ||
      !patient_name ||
      !number_1 ||
      !opu_date ||
      no_of_embryo_frozen == null ||
      no_of_egg_frozen == null ||
      remaining_embryo == null ||
      remaining_egg == null ||
      !next_freezing_due_date ||
      amount_due == null ||
      amount_payable == null
    ) {
      return res.status(400).json({
        message:
          "Required fields missing: reg_no, patient_name, number_1, opu_date, no_of_embryo_frozen, no_of_egg_frozen, remaining_embryo, remaining_egg, next_freezing_due_date, amount_due, amount_payable"
      });
    }

    let existingPatient = null;
    let patientIdToUpdate = null;

    // If update: load the patient
    if (id) {
      patientIdToUpdate = parseInt(id, 10);
      if (isNaN(patientIdToUpdate)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }

      existingPatient = await Patient.findOne({
        where: { id: patientIdToUpdate, clinic_id: clinicId }
      });

      if (!existingPatient) {
        return res.status(404).json({ message: "Patient not found to update" });
      }

      // Check reg_no duplicates
      if (existingPatient.reg_no !== reg_no) {
        const dupReg = await Patient.findOne({
          where: {
            reg_no,
            clinic_id: clinicId,
            id: { [Op.ne]: patientIdToUpdate }
          }
        });
        if (dupReg) {
          return res.status(400).json({
            message: "Another patient with this registration number already exists."
          });
        }
      }

      // **NEW**: check primary_mobile duplicates
      if (existingPatient.primary_mobile !== number_1) {
        const dupMobile = await Patient.findOne({
          where: {
            primary_mobile: number_1,
            clinic_id: clinicId,
            id: { [Op.ne]: patientIdToUpdate }
          }
        });
        if (dupMobile) {
          return res.status(400).json({
            message: "Another patient with this primary mobile already exists."
          });
        }
      }

    } else {
      // Create case: check reg_no
      const dupReg = await Patient.findOne({
        where: { reg_no, clinic_id: clinicId }
      });
      if (dupReg) {
        return res.status(400).json({
          message: "A patient with this registration number already exists."
        });
      }

      // **NEW**: check primary_mobile
      const dupMobile = await Patient.findOne({
        where: { primary_mobile: number_1, clinic_id: clinicId }
      });
      if (dupMobile) {
        return res.status(400).json({
          message: "A patient with this primary mobile already exists."
        });
      }
    }

    // compute next_followup_date (one month before next_freezing_due_date, or today)
    let followUpDate = new Date(next_freezing_due_date);
    followUpDate.setMonth(followUpDate.getMonth() - 1);
    const today = new Date();
    const followUpMid = new Date(
      followUpDate.getFullYear(),
      followUpDate.getMonth(),
      followUpDate.getDate()
    );
    const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (followUpMid < todayMid) {
      followUpDate = todayMid;
    } else {
      followUpDate = followUpMid;
    }
    const followUpDateString = followUpDate.toISOString().split("T")[0];

    // build payload
    const patientPayload = {
      clinic_id: clinicId,
      spouse_name: spouse_name || null,
      secondary_mobile: number_2 || null,
      email: email || null,
      remaining_embryo: parseInt(remaining_embryo, 10),
      remaining_egg: parseInt(remaining_egg, 10),
      next_freezing_due_date,
      next_followup_date: followUpDateString,
      amount_due: parseFloat(amount_due),
      amount_payable: parseFloat(amount_payable),
      updatedBy: userId
    };

    let savedPatient;
    if (existingPatient) {
      // update
      await existingPatient.update(patientPayload);
      savedPatient = existingPatient;
    } else {
      // create
      Object.assign(patientPayload, {
        reg_no,
        patient_name,
        primary_mobile: number_1,
        opu_date,
        no_of_embryo_frozen: parseInt(no_of_embryo_frozen, 10),
        no_of_egg_frozen: parseInt(no_of_egg_frozen, 10),
        createdBy: username
      });
      savedPatient = await Patient.create(patientPayload);
    }

    const responseMessage = existingPatient
      ? "Patient updated successfully."
      : "Patient created successfully.";

    return res
      .status(existingPatient ? 200 : 201)
      .json({ message: responseMessage, patient: savedPatient.toJSON() });

  } catch (error) {
    console.error("Error saving patient data:", error);
    return res.status(500).json({ message: "Failed to save patient data" });
  }
};


exports.getPatientData = async (req, res) => {
  const { patientId } = req.params;
  const clinicId = 1;

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  const numericId = parseInt(patientId, 10);
  if (isNaN(numericId)) {
    return res.status(400).json({ message: "Invalid patient ID" });
  }

  try {
    const patient = await Patient.findOne({
      where: { id: numericId, clinic_id: clinicId }
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    return res.status(200).json({ patient: patient.toJSON() });
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Failed to fetch patient data" });
  }
};


exports.getAllPatients = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Please log in",
      });
    }

    let {
      page = 1,
      limit = 50,
      reg_no,
      patient_name,
      primary_mobile,
      email,
      next_followup,
      next_freezing_from,   // ISO date string, e.g. "2025-06-15"
      next_freezing_to      // ISO date string, e.g. "2025-07-15"
    } = req.query;

    page  = Math.max(1, Number(page)  || 1);
    limit = Math.max(10, Number(limit) || 50);
    const offset = (page - 1) * limit;

    // Base filter
    const where = { clinic_id: clinicId };
    if (reg_no)         where.reg_no         = { [Op.like]: `%${reg_no}%` };
    if (patient_name)   where.patient_name   = { [Op.like]: `%${patient_name}%` };
    if (primary_mobile) where.primary_mobile = { [Op.like]: `%${primary_mobile}%` };
    if (email)          where.email          = { [Op.like]: `%${email}%` };

    // next_followup (unchanged) …
    // … insert your existing next_followup logic here …

    // NEW: next_freezing due date RANGE filter
    if (next_freezing_from && next_freezing_to) {
      // both bounds → between
      where.next_freezing_due_date = {
        [Op.between]: [ next_freezing_from, next_freezing_to ]
      };
    } else if (next_freezing_from) {
      // from only → greater or equal
      where.next_freezing_due_date = { [Op.gte]: next_freezing_from };
    } else if (next_freezing_to) {
      // to only → less or equal
      where.next_freezing_due_date = { [Op.lte]: next_freezing_to };
    }

    // Fetch
    const { rows: patients, count: total } = await Patient.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    if (!patients.length && page > 1) {
      return res.redirect(`/patients?page=1`);
    }

    return res.status(200).json({
      success:     true,
      patients,
      totalPatients: total,
      totalPages:  Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (err) {
    console.error("Error fetching patients:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};


exports.saveFollowUp = async (req, res) => {
  const userId = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!clinicId || !userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const { patientId, nextFollowUpDate, followUpType, notes } = req.body;

    // Validate existence of patient under this clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create the follow-up record
    const followup = await PatientFollowUp.create({
      patient_id: patientId,
      clinic_id: clinicId,
      nextFollowUpDate,
      followUpType,
      notes,
      username,
      status: 'Pending'
    });

    // Update patient's next_followup_date and last_followup_date

    await patient.update({
      next_followup_date: nextFollowUpDate,
      updatedBy: username
    });

    return res.status(201).json({ message: 'Follow-up saved', followup });
  } catch (error) {
    console.error('Error saving follow-up:', error);
    return res.status(500).json({ message: 'Failed to save follow-up' });
  }
};


exports.getFollowupHistory = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const { patientId } = req.params;

  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Ensure patient belongs to clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch follow-ups
    const followups = await PatientFollowUp.findAll({
      where: { patient_id: patientId },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({ followups });
  } catch (error) {
    console.error('Error fetching follow-up history:', error);
    return res.status(500).json({ message: 'Failed to fetch follow-up history' });
  }
};


exports.saveInteraction = async (req, res) => {
  console.log(req.body);
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!clinicId || !userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const {
      patientId,
      interactionType,
      interactionDateTime,
      summary,
      interactionFollowupDate,
      interactionFollowupType,
      discardDate,
      shiftedDate
    } = req.body;

    // 1️⃣ ensure patient exists in this clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // 2️⃣ handle uploaded document
    let documentFilename = null;
    if (req.file) {
      documentFilename = req.file.filename;
    }

    // 3️⃣ create interaction record
    const interaction = await PatientInteraction.create({
      clinic_id:       clinicId,
      patient_id:      patientId,
      interactionType,
      interactionDate: interactionDateTime,
      document:        documentFilename,
      notes:           summary,
      username
    });

    // 4️⃣ update patient's last_followup_date
    await patient.update({
      last_followup_date: interactionDateTime,
      updatedBy:          username
    });

    // 5️⃣ handle special types: Discard or Shifted
    if (interactionType === 'Discard') {
      await patient.update({
        status:             'Discarded',
        dicard_date:        discardDate || interactionDateTime,
        amount_due:         0,
        amount_payable:     0,
        remaining_embryo:   0,
        remaining_egg:      0,
        updatedBy:          username
      });
    } else if (interactionType === 'Shifted To Another Clinic') {
      await patient.update({
        status:             'Shifted',
        shifted_date:       shiftedDate || interactionDateTime,
        amount_due:         0,
        amount_payable:     0,
        remaining_embryo:   0,
        remaining_egg:      0,
        updatedBy:          username
      });
    }

    // 6️⃣ if follow‑up info provided, create a PatientFollowUp entry
    if (interactionFollowupDate && interactionFollowupType) {
      await PatientFollowUp.create({
        clinic_id:        clinicId,
        patient_id:       patientId,
        nextFollowUpDate: interactionFollowupDate,
        followUpType:     interactionFollowupType,
        notes:            summary,
        username
      });

      // update patient's next_followup_date
      await patient.update({
        next_followup_date: interactionFollowupDate,
        updatedBy:          username
      });
    }

    return res.status(201).json({
      message: 'Interaction saved',
      interaction
    });

  } catch (error) {
    console.error('Error saving interaction:', error);
    return res.status(500).json({ message: 'Failed to save interaction' });
  }
};




/**
 * Get interaction history for a patient.
 */
exports.getInteractionHistory = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const { patientId } = req.params;

  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Ensure patient belongs to clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch interactions
    const interactions = await PatientInteraction.findAll({
      where: { patient_id: patientId },
      order: [['createdAt', 'DESC']]
    });

    // Build full URL for document if exists
    const results = interactions.map(item => {
      return {
        interactionDateTime: item.interactionDate,
        interactionType: item.interactionType,
        summary: item.notes,
        username: item.username,
        documentUrl: item.document || null
      };
    });

    return res.status(200).json({ interactions: results });
  } catch (error) {
    console.error('Error fetching interaction history:', error);
    return res.status(500).json({ message: 'Failed to fetch interaction history' });
  }
};

exports.savePayment = async (req, res) => {
  const userId = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!clinicId || !userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const { patientId, paidAmount, paidUptoDate, balance, notes, paymentDate } = req.body;

    // Validate patient exists in this clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Create payment record
    const payment = await PatientPayment.create({
      clinic_id: clinicId,
      patient_id: patientId,
      paidAmount,
      paymentDate,   // ISO timestamp or server‐set
      paidUptoDate,
      balance,
      notes,
      username
    });

;
    await patient.update({ 
      amount_payable: balance, 
      updatedBy: username ,
      next_freezing_due_date:paidUptoDate

    });

    return res.status(201).json({ message: 'Payment saved', payment });
  } catch (error) {
    console.error('Error saving payment:', error);
    return res.status(500).json({ message: 'Failed to save payment' });
  }
};


exports.getPaymentHistory = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const { patientId } = req.params;

  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Ensure patient belongs to this clinic
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId }
    });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch payment records
    const payments = await PatientPayment.findAll({
      where: { patient_id: patientId },
      order: [['createdAt', 'DESC']]
    });

    // Map results to a simpler JSON
    const results = payments.map(p => ({
      paymentDate: p.paymentDate,
      paidAmount: p.paidAmount,
      paidUptoDate: p.paidUptoDate,
      balance: p.balance,
      notes: p.notes,
      username: p.username
    }));

    return res.status(200).json({ payments: results });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return res.status(500).json({ message: 'Failed to fetch payment history' });
  }
};



exports.getDashboardData = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  // parse optional date-range filters from query
  let { startDate, endDate } = req.query;
  // normalize to Date objects (or null)
  const start = startDate ? new Date(startDate) : null;
  const end   = endDate   ? new Date(endDate)   : null;

  try {
    // 1️⃣ total patients (always clinic-wide)
    const totalPatients = await Patient.count({
      where: { clinic_id: clinicId }
    });

    // build a WHERE clause for date-based metrics
    const dateWhere = { clinic_id: clinicId };
    if (start && end) {
      dateWhere.createdAt = { [Op.between]: [ start, end ] };
    } else if (start) {
      dateWhere.createdAt = { [Op.gte]: start };
    } else if (end) {
      dateWhere.createdAt = { [Op.lte]: end };
    }

    // 2️⃣ totalDue over date range
    const dueResult = await Patient.findOne({
      attributes: [[ fn('SUM', col('amount_due')), 'totalDue' ]],
      where: { clinic_id: clinicId, ...(
        start || end ? { 
          updatedAt: dateWhere.createdAt  // use updatedAt for due changes
        } : {}
      ) },
      raw: true
    });
    const totalDue = Number(dueResult.totalDue) || 0;

    // 3️⃣ patientsWithDue over date range
    const patientsWithDue = await Patient.count({
      where: {
        clinic_id: clinicId,
        amount_due: { [Op.gt]: 0 },
        ...(start || end ? { 
          updatedAt: dateWhere.createdAt 
        } : {})
      }
    });

    // 4️⃣ upcoming follow‑ups (always next 7 days, not date-range)
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(today.getDate() + 7);
    const upcomingFollowups = await PatientFollowUp.count({
      where: {
        clinic_id: clinicId,
        nextFollowUpDate: {
          [Op.between]: [
            today.toISOString().split('T')[0],
            sevenDaysLater.toISOString().split('T')[0]
          ]
        }
      }
    });

    // 5️⃣ totalInteractions over date range
    const totalInteractions = await PatientInteraction.count({
      where: {
        clinic_id: clinicId,
        ...(start || end ? { createdAt: dateWhere.createdAt } : {})
      }
    });

    // 6️⃣ recentPayments over date range
    const paymentsWhere = { clinic_id: clinicId };
    if (start && end) {
      paymentsWhere.paymentDate = { [Op.between]: [ start, end ] };
    } else if (start) {
      paymentsWhere.paymentDate = { [Op.gte]: start };
    } else if (end) {
      paymentsWhere.paymentDate = { [Op.lte]: end };
    }
    const paymentsResult = await PatientPayment.findOne({
      attributes: [[ fn('SUM', col('paidAmount')), 'recentPayments' ]],
      where: paymentsWhere,
      raw: true
    });
    const recentPayments = Number(paymentsResult.recentPayments) || 0;

    return res.status(200).json({
      totalPatients,
      totalDue,
      patientsWithDue,
      upcomingFollowups,
      totalInteractions,
      recentPayments
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ message: 'Failed to load dashboard data' });
  }
};

exports.saveLead = async (req, res) => {
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  // start a transaction
  const t = await sequelize.transaction();
  try {
    const {
      leadDate,
      female,
      male,
      contacts,
      email,
      clinic,     
      marriage,
      pastTreatments,
      sources,
      address,
      agent,
      admin
    } = req.body;

    // 1) create without patientId
    const newLead = await Lead.create({
      clinic_id:      clinicId,
      lead_date:      leadDate,
      female_name:    female.name,
      female_age:     female.age,
      male_name:      male.name,
      male_age:       male.age,
      primary_mobile: contacts.primary,
      secondary_mobile: contacts.alternate,
      email,
      clinic,
      marriageDate:     marriage.date,
      marriage_duration:{
        years:  marriage.years,
        months: marriage.months,
        days:   marriage.days
      },
      past_treatments: Array.isArray(pastTreatments)
                         ? JSON.stringify(pastTreatments)
                         : pastTreatments,
      source_primary:   sources.primary,
      source_secondary: sources.secondary,
      country:          address.country,
      state:            address.state,
      pin_code:         address.pinCode,
      full_address:     address.fullAddress,
      agent,
      admin,
      createdBy:        username,
      updatedBy:        username
    }, { transaction: t });

    // 2) generate patientId
    const yy        = new Date().getFullYear() % 100;
    const seq       = newLead.id.toString().padStart(2, '0');
    const patientId = `AV${yy}-${seq}`;

    // 3) update with patientId
    newLead.patientId = patientId;
    newLead.updatedBy = username;
    await newLead.save({ transaction: t });

    // commit all changes together
    await t.commit();

    return res.status(201).json({
      message: 'Lead saved successfully',
      lead:    newLead
    });

  } catch (error) {
    // rollback on error
    await t.rollback();
    console.error('Error saving lead:', error);
    return res.status(500).json({ message: 'Failed to save lead' });
  }
};

exports.updateLead = async (req, res) => {
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const {
      patientId,
      leadDate,
      female,
      male,
      contacts,
      email,
      clinic,
      marriage,
      sources,
      pastTreatments,
      address,
      agent,
      admin
    } = req.body;

    // 1) Fetch existing lead
    const lead = await Lead.findOne({
      where: { patientId, clinic_id: clinicId }
    });
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // 2) Fetch current user
    const user = await User.findOne({
      where: { id: userId, clinic_id: clinicId }
    });

    if (!user) {
      return res.status(403).json({ message: 'User not found' });
    }

    // 3) Check if user is master or creator
    const isMaster = user.master === true || user.master === 1;
    const isCreator = lead.createdBy === username;

    if (!isMaster && !isCreator) {
      return res.status(403).json({ message: 'Permission denied: You are not allowed to update this lead' });
    }

    // 4) Proceed with update
    const updates = {
      lead_date:       leadDate,
      female_name:     female.name,
      female_age:      female.age,
      male_name:       male.name,
      male_age:        male.age,
      primary_mobile:  contacts.primary,
      secondary_mobile:contacts.alternate,
      email,
      clinic,
      marriageDate:    marriage.date,
      marriage_duration: {
        years:  marriage.years,
        months: marriage.months,
        days:   marriage.days
      },
      past_treatments: Array.isArray(pastTreatments)
                          ? JSON.stringify(pastTreatments)
                          : pastTreatments,
      source_primary:  sources.primary,
      source_secondary: sources.secondary,
      country:         address.country,
      state:           address.state,
      pin_code:        address.pinCode,
      full_address:    address.fullAddress,
      agent,
      admin,
      updatedBy:       username
    };

    await lead.update(updates);

    return res.json({
      message: 'Lead updated successfully',
      lead
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ message: 'Failed to update lead' });
  }
};

exports.getLead = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { patientId } = req.params;
  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  try {
    const lead = await Lead.findOne({
      where: { patientId, clinic_id: clinicId }
    });
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json({ lead });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch lead' });
  }
};



exports.saveFollowUp = async (req, res) => {
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const {
      patient_id,
      call_date,
      remark,
      priority,
      status,
      followup_date,
      reason
    } = req.body;

      // validate required
    if (!patient_id ) {
      return res.status(400).json({ message: 'Please Select Patient' });
    }
    // ensure required
    if (!patient_id || !call_date || !priority || !status || !remark) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newFU = await LeadFollowUp.create({
      clinic_id:      clinicId,
      patient_id,
      call_date,
      remark,
      priority,
      status,
      followup_date: status === 'followup' ? followup_date : null,
      reason:        status === 'not-qualified' ? reason : null,
      created_by:    username
    });

    return res.status(201).json({
      message:     'Follow‑up saved successfully',
      followUp:    newFU
    });
  } catch (error) {
    console.error('Error saving follow‑up:', error);
    return res.status(500).json({ message: 'Failed to save follow‑up' });
  }
};

exports.getFollowUps = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const patientId = req.query.patientId;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }
  if (!patientId) {
    return res.status(400).json({ message: 'Missing patientId query parameter' });
  }

  try {
    const rows = await LeadFollowUp.findAll({
      where: {
        clinic_id: clinicId,
        patient_id: patientId
      },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ followUps: rows });
  } catch (error) {
    console.error('Error fetching follow‑ups:', error);
    return res.status(500).json({ message: 'Failed to fetch follow‑ups' });
  }
};

exports.saveAppointment = async (req, res) => {
  console.log(req.body)
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const {
      patient_id,
      appointment_clinic,
      appointment_date,
      appointment_doctor_id,
      appointment_doctor,
      status,
      apptTimeSlot
    } = req.body;

     // validate required
    if (!patient_id ) {
      return res.status(400).json({ message: 'Please Select Patient' });
    }
    // validate required
    if (!patient_id || !appointment_clinic || !appointment_date || !appointment_doctor || !appointment_doctor_id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const newAppt = await LeadAppointment.create({
      clinic_id:            clinicId,
      patient_id,
      appointment_clinic,
      appointment_date,
      appointment_doctor_id,
      appointment_doctor,
      status:               status || 'Scheduled',
      created_by:           username,
      apptTimeSlot

    });

    return res.status(201).json({
      message:     'Appointment scheduled successfully',
      appointment: newAppt
    });
  } catch (error) {
    console.error('Error saving appointment:', error);
    return res.status(500).json({ message: 'Failed to save appointment' });
  }
};

exports.getAppointments = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const patientId = req.query.patientId;
console.log(req.params)
  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!patientId) {
    return res.status(400).json({ message: 'Missing patientId query parameter' });
  }

  try {
    const appointments = await LeadAppointment.findAll({
      where: {
        clinic_id: clinicId,
        patient_id: patientId
      },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({ message:  'Failed to fetch appointments' });
  }
};

exports.saveAndUpdateLeadAppointments = async (req, res) => {
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;
  const { id }   = req.params;
  const {
    status,
    appointment_date,
    appointment_clinic,
    appointment_doctor,
    apptTimeSlot,
    appointment_doctor_id

  } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }
  if (!status || !appointment_date || !appointment_clinic || !appointment_doctor || !appointment_doctor_id || !apptTimeSlot) {
    return res.status(400).json({ message: 'Missing required fields for reschedule' });
  }

  // start transaction
  const t = await sequelize.transaction();
  try {
    // 1) Fetch original
    const original = await LeadAppointment.findOne({
      where: { id, clinic_id: clinicId },
      transaction: t
    });
    if (!original) {
      await t.rollback();
      return res.status(404).json({ message: 'Original appointment not found' });
    }

    // 2) Create new rescheduled entry
    const newAppt = await LeadAppointment.create({
      clinic_id:            clinicId,
      patient_id:           original.patient_id,
      appointment_clinic,
      appointment_date,
      appointment_doctor,
      appointment_doctor_id,
      apptTimeSlot,
      status:"Scheduled",
      created_by:           username
    }, { transaction: t });

    // 3) Update original’s status
    original.status    = status;
    original.updated_by = username;
    await original.save({ transaction: t });

    await t.commit();
    return res.status(201).json({
      message:       'Appointment rescheduled and original status updated',
      newAppointment: newAppt,
      original
    });
  } catch (error) {
    await t.rollback();
    console.error('Error rescheduling appointment:', error);
    return res.status(500).json({ message: 'Failed to reschedule appointment' });
  }
};
exports.updateAptStatus = async (req, res) => {
  const userId   = req.user?.id;
  const username = req.user?.username || 'system';
  const clinicId = req.user?.clinic_id;
  const { id }   = req.params;
  const { status } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!status) {
    return res.status(400).json({ message: 'Missing required field: status' });
  }

  const t = await sequelize.transaction();
  try {
    const original = await LeadAppointment.findOne({
      where: { id, clinic_id: clinicId },
      transaction: t,
      lock: t.LOCK.UPDATE
    });

    if (!original) {
      await t.rollback();
      return res.status(404).json({ message: 'Appointment not found' });
    }

    original.status     = status;
    original.updated_by = username;

    await original.save({ transaction: t });

    await t.commit();
    return res.status(200).json({
      message: 'Appointment status updated',
      appointment: original
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating appointment status:', error);
    return res.status(500).json({ message: 'Failed to update appointment status' });
  }
};

exports.saveFollowUpUpdateLeadAppointment = async (req, res) => {
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;
  const { id }   = req.params;
  const {
    status,
    next_followup_date,
    cancel_remark,
  } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!status || !next_followup_date) {
    return res.status(400).json({ message: 'Missing required fields for follow-up' });
  }

  // Start transaction
  const t = await sequelize.transaction();
  try {
    // 1) Fetch original appointment
    const original = await LeadAppointment.findOne({
      where: { id, clinic_id: clinicId },
      transaction: t
    });
    if (!original) {
      await t.rollback();
      return res.status(404).json({ message: 'Original appointment not found' });
    }

    // 2) Create new follow-up entry
    const newAppt = await LeadFollowUp.create({
      clinic_id:     clinicId,
      patient_id:    original.patient_id,
      call_date:     new Date(), // Today's date
      remark:        cancel_remark,
      followup_date: next_followup_date,
      priority:      "cold",
      status:        "followup",
      created_by:    username
    }, { transaction: t });

    // 3) Update original appointment's status
    original.status     = status;
    original.updated_by = username;
    await original.save({ transaction: t });

    await t.commit();
    return res.status(201).json({
      message:         'Follow-up scheduled and appointment status updated',
      newAppointment:  newAppt,
      original
    });
  } catch (error) {
    await t.rollback();
    console.error('Error saving follow-up:', error);
    return res.status(500).json({ message: 'Failed to save follow-up' });
  }
};


exports.getAllLeads = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { page = 1, limit = 50, ...filters } = req.query;

    const where = {
      clinic_id: clinicId
    };

    if (filters.patient_id) where.patientId = { [Op.like]: `%${filters.patient_id}%` };
    if (filters.female_name) where.female_name = { [Op.like]: `%${filters.female_name}%` };
    if (filters.primary_mobile) where.primary_mobile = { [Op.like]: `%${filters.primary_mobile}%` };
    if (filters.email) where.email = { [Op.like]: `%${filters.email}%` };
    if (filters.lead_date) where.lead_date = filters.lead_date;
    if (filters.status) where.status = filters.status;

    const offset = (page - 1) * limit;

    const { rows, count } = await Lead.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      leads: rows,
      totalLeads: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
};


exports.saveVisited = async (req, res) => {
  console.log('saveVisited body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const {
      patient_id,
      visit_date,
      uhid,
      doctor_notes,
      consultant_name,
      consultant_notes
    } = req.body;

    // basic validation
    if (!patient_id) {
      return res.status(400).json({ message: 'Please select patient' });
    }
    if (!visit_date || !uhid) {
      return res.status(400).json({ message: 'Missing required fields: visit_date or uhid' });
    }

    // find the latest appointment for this patient in this clinic with status 'Visited'
    const latestVisitedAppt = await LeadAppointment.findOne({
      where: {
        clinic_id: clinicId,
        patient_id,
        status: 'Visited'
      },
      order: [
        // prefer appointment_datetime, fall back to createdAt if needed
        ['appointment_date', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    if (!latestVisitedAppt) {
      // no appointment marked visited yet — ask user to mark appointment visited first
      return res.status(400).json({
        message: 'No appointment found with status "Visited" for this patient. Please mark the appointment as visited first.'
      });
    }

    // use appointment_doctor from the latest visited appointment as doctor_name
    const doctor_name = latestVisitedAppt.appointment_doctor || null;

    const newVisited = await LeadVisited.create({
      clinic_id: clinicId,
      patient_id,
      visit_date,
      uhid,
      doctor_name,
      doctor_notes: doctor_notes || null,
      consultant_name: consultant_name || null,
      consultant_notes: consultant_notes || null,
      created_by: username
    });

    return res.status(201).json({
      message: 'Visit record saved successfully',
      visited: newVisited
    });
  } catch (error) {
    console.error('Error saving visit record:', error);
    return res.status(500).json({ message: 'Failed to save visit record' });
  }
};

exports.getVisiteds = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const patientId = req.query.patientId;

  console.log(req.params);

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!patientId) {
    return res.status(400).json({ message: 'Missing patientId query parameter' });
  }

  try {
    const visited = await LeadVisited.findAll({
      where: {
        clinic_id: clinicId,
        patient_id: patientId
      },
      order: [
        ['visit_date', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    return res.json({ visited });
  } catch (error) {
    console.error('Error fetching visited records:', error);
    return res.status(500).json({ message: 'Failed to fetch visited records' });
  }
};

exports.saveVisitFollowUp = async (req, res) => {
  console.log('saveVisitFollowUp body:', req.body);
  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const {
      visit_id,
      patient_id,
      call_date,
      remark,
      priority,
      status,
      followup_date
    } = req.body;

    // validate required
    if (!patient_id || !visit_id) {
      return res.status(400).json({ message: 'Missing patient or visit reference' });
    }

    if (!call_date || !remark || !priority || !status) {
      return res.status(400).json({ message: 'Missing required follow-up fields' });
    }

    // create record
    const newFU = await VisitFollowup.create({
      clinic_id:     clinicId,
      visit_id,
      patient_id,
      call_date,
      remark,
      priority,
      status,
      followup_date: status === 'followup' ? followup_date : null,
      created_by:    username
    });

    return res.status(201).json({
      message:   'Visit follow-up saved successfully',
      followUp:  newFU
    });
  } catch (error) {
    console.error('Error saving visit follow-up:', error);
    return res.status(500).json({ message: 'Failed to save visit follow-up' });
  }
};

exports.getFollowUpsForVisit = async (req, res) => {
  
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const visitId  = req.query.visitId;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!visitId) {
    return res.status(400).json({ message: 'Missing visitId query parameter' });
  }

  try {
    const followUps = await VisitFollowup.findAll({
      where: {
        clinic_id: clinicId,
        visit_id: visitId
      },
      order: [['createdAt', 'DESC']]
    });

    return res.json({ followUps });
  } catch (error) {
    console.error('Error fetching visit follow-ups:', error);
    return res.status(500).json({ message: 'Failed to fetch visit follow-ups' });
  }
};

exports.saveConverted = async (req, res) => {
  console.log('saveConverted body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    let {
      patient_id,
      procedures,        // array or comma-separated string
      package_price,
      package_offered,   // decimal now
      discount,
      counselor_name,
      booking_date,
      payment_status     // optional: 'pending'|'paid'|'partial'
    } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!patient_id) missingFields.push('patient_id');

    // Normalize procedures -> store as JSON string of array
    let proceduresArray = [];
    if (Array.isArray(procedures)) {
      proceduresArray = procedures.map(p => String(p).trim()).filter(Boolean);
    } else if (typeof procedures === 'string' && procedures.trim().length) {
      proceduresArray = procedures.split(',').map(p => p.trim()).filter(Boolean);
    }

    if (!proceduresArray.length) missingFields.push('procedures');

    // Parse numeric fields
    const parseDecimal = v => {
      if (v === undefined || v === null || v === '') return null;
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : null;
    };

    const packagePriceParsed   = parseDecimal(package_price);
    const packageOfferedParsed = parseDecimal(package_offered);
    const discountParsed       = parseDecimal(discount);

    if (packagePriceParsed === null) missingFields.push('package_price');
    if (packageOfferedParsed === null) missingFields.push('package_offered');
    if (discountParsed === null) missingFields.push('discount');

    if (!counselor_name || !counselor_name.trim()) missingFields.push('counselor_name');
    if (!booking_date || booking_date.trim() === '') missingFields.push('booking_date');

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing required fields: ' + missingFields.join(', ')
      });
    }

    const proceduresSerialized = JSON.stringify(proceduresArray);

    // Normalize payment_status
    const allowedPayment = ['pending', 'paid', 'partial'];
    const paymentStatusNormalized = allowedPayment.includes(String(payment_status || '').toLowerCase())
      ? String(payment_status).toLowerCase()
      : 'pending';

    const created = await LeadConverted.create({
      clinic_id: clinicId,
      patient_id: String(patient_id),
      procedures: proceduresSerialized,
      package_price: packagePriceParsed,
      package_offered: packageOfferedParsed,
      discount: discountParsed,
      counselor_name: counselor_name.trim(),
      booking_date: booking_date,
      payment_status: paymentStatusNormalized,
      created_by: username || String(userId)
    });

    // Respond with parsed procedures for convenience
    const response = {
      message: 'Conversion record saved successfully',
      converted: {
        ...created.get({ plain: true }),
        procedures: proceduresArray
      }
    };

    return res.status(201).json(response);

  } catch (error) {
    console.error('Error saving conversion record:', error);
    return res.status(500).json({ message: 'Failed to save conversion record' });
  }
};

exports.getConverted = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const patientId = req.query.patientId;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!patientId) {
    return res.status(400).json({ message: 'Missing patientId query parameter' });
  }

  try {
    // 1. Fetch converted records
    const converted = await LeadConverted.findAll({
      where: {
        clinic_id: clinicId,
        patient_id: patientId
      },
      order: [
        ['booking_date', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    // 2. Fetch latest visited date marked as converted (if any)
    const latestVisited = await LeadVisited.findOne({
      where: {
        clinic_id: clinicId,
        patient_id: patientId
      },
      order: [['visit_date', 'DESC']]
    });

    const latestVisitedDate = latestVisited ? latestVisited.visit_date : null;

    // 3. Parse procedures JSON for each converted record
    const convertedWithProcedures = converted.map(c => {
      let proceduresParsed = [];
      try {
        proceduresParsed = JSON.parse(c.procedures || '[]');
      } catch (e) {
        proceduresParsed = (c.procedures || '').split(',').map(s => s.trim()).filter(Boolean);
      }
      return {
        ...c.get({ plain: true }),
        procedures: proceduresParsed,
        latest_visited_date: latestVisitedDate
      };
    });

    return res.json({ converted: convertedWithProcedures });
  } catch (error) {
    console.error('Error fetching converted records:', error);
    return res.status(500).json({ message: 'Failed to fetch converted records' });
  }
};


exports.getAppointmentsByDoctor = async (req, res) => {
  console.log('getAppointmentsByDoctor query:', req.query);

  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const doctor_id = req.query.doctor_id;
  const { start, end } = req.query;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  if (!doctor_id) {
    return res.status(400).json({ message: 'doctor_id required' });
  }

  try {
    // build where clause and ensure clinic scoping
    const where = {
      appointment_doctor_id: doctor_id,
      clinic_id: clinicId
    };

    if (start && end) {
      // use date range; ensure Dates are valid
      const startDt = new Date(start);
      const endDt = new Date(end);
      if (!isNaN(startDt) && !isNaN(endDt)) {
        where.appointment_date = { [Op.between]: [startDt, endDt] };
      }
    }

    const appts = await LeadAppointment.findAll({
      where,
      order: [['appointment_date', 'ASC']],
      attributes: ['id','clinic_id','patient_id','appointment_date','apptTimeSlot','appointment_doctor','status','created_by']
    });

    // If no appointments, return quickly
    if (!appts || appts.length === 0) {
      return res.json({ appointments: [] });
    }

    // Bulk fetch Leads for all patient_ids to avoid N+1 queries
    const patientIds = [...new Set(appts.map(a => a.patient_id).filter(Boolean))];
    const leads = patientIds.length
      ? await Lead.findAll({ where: { patientId: patientIds }, attributes: ['patientId','female_name','male_name','primary_mobile'] })
      : [];

    const leadMap = leads.reduce((m, L) => {
      m[String(L.patientId)] = L;
      return m;
    }, {});

    const result = appts.map(a => {
      const lead = leadMap[String(a.patient_id)] || null;
      return {
        id: a.id,
        clinic_id: a.clinic_id,
        patient_id: a.patient_id,
        patient_name: lead ? (lead.female_name || lead.male_name) : null,
        patient_phone: lead ? lead.primary_mobile : null,
        appointment_date: a.appointment_date,
        apptTimeSlot: a.apptTimeSlot,
        appointment_doctor: a.appointment_doctor,
        status: a.status
      };
    });

    return res.json({ appointments: result });
  } catch (err) {
    console.error('getAppointmentsByDoctor error:', err);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

exports.getAppointmentById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const clinicId = req.user?.clinic_id;
    const { id } = req.params;


    if (!userId || !clinicId) {
      return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }

    if (!id) {
      return res.status(400).json({ message: 'Missing appointment ID parameter' });
    }

    //  Fetch appointment and restrict to clinic
    const appt = await LeadAppointment.findOne({
      where: { id, clinic_id: clinicId }
    });

    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found or unauthorized access' });
    }

    // Fetch associated lead (patient) details
    const lead = await Lead.findOne({ where: { patientId: appt.patient_id } });

    return res.json({ appointment: appt, lead });
  } catch (err) {
    console.error('Error fetching appointment by ID:', err);
    return res.status(500).json({ message: 'Failed to fetch appointment' });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const userId   = req.user?.id;
    const username = req.user?.username || 'system';
    const clinicId = req.user?.clinic_id;
    const { id } = req.params;

    if (!userId || !clinicId) {
      return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
    if (!id) {
      return res.status(400).json({ message: 'Missing appointment ID' });
    }

    // Find appointment scoped to clinic
    const appt = await LeadAppointment.findOne({ where: { id, clinic_id: clinicId } });
    if (!appt) {
      return res.status(404).json({ message: 'Appointment not found or access denied' });
    }

    // Prevent cancelling if already visited (optional business rule)
    if (appt.status && appt.status.toLowerCase() === 'visited') {
      return res.status(400).json({ message: 'Cannot cancel a visited appointment' });
    }

    // If already cancelled, return OK
    if (appt.status && appt.status.toLowerCase() === 'cancelled') {
      return res.json({ message: 'Appointment already cancelled', appointment: appt });
    }

    // Update appointment
    appt.status = 'Cancelled';
    // add optional audit fields — create columns if you want to store them (cancelled_by, cancelled_at)
    // If your model doesn't have these, you can omit setting them or create a Visit/Cancellation log table.
    appt.cancelled_by = username;
    appt.cancelled_at = new Date();

    await appt.save();

    return res.json({ message: 'Appointment cancelled successfully', appointment: appt });
  } catch (err) {
    console.error('cancelAppointment error:', err);
    return res.status(500).json({ message: 'Failed to cancel appointment' });
  }
};

function buildLeadWhere(query) {
  const leadWhere = {};
  if (query.patientId) leadWhere.patientId = query.patientId;
  if (query.femaleName) leadWhere.female_name = { [Op.like]: `%${query.femaleName}%` };
  if (query.mobile) leadWhere.primary_mobile = { [Op.like]: `%${query.mobile}%` };
  if (query.email) leadWhere.email = { [Op.like]: `%${query.email}%` };
  return leadWhere;
}


/**
 * Build date condition for a particular field (returns undefined if no dates provided)
 * Accepts YYYY-MM-DD strings in query.startDate / query.endDate
 */
function buildDateWhere(query, fieldName) {
  if (!query.startDate && !query.endDate) return undefined;
  const start = query.startDate ? new Date(query.startDate) : null;
  const end = query.endDate ? new Date(query.endDate) : null;
  if (start && end) {
    // include full end day
    end.setHours(23, 59, 59, 999);
    return { [fieldName]: { [Op.between]: [start.toISOString(), end.toISOString()] } };
  }
  if (start) return { [fieldName]: { [Op.gte]: start.toISOString() } };
  if (end) {
    end.setHours(23, 59, 59, 999);
    return { [fieldName]: { [Op.lte]: end.toISOString() } };
  }
  return undefined;
}

/**
 * Helper: given an array of rows that have `patient_id`, fetch Leads in bulk and return a map { patientId -> leadPlainObject }
 */
async function fetchLeadsMapByPatientIds(patientIds) {
  if (!patientIds || !patientIds.length) return {};
  const leads = await Lead.findAll({
    where: { patientId: { [Op.in]: patientIds } },
    attributes: ['patientId', 'female_name', 'male_name', 'primary_mobile', 'email', 'lead_date']
  });
  const map = {};
  leads.forEach(l => { map[l.patientId] = l.toJSON(); });
  return map;
}

/**
 * GET /followups
 * Query params supported: patientId, femaleName, mobile, email, startDate, endDate
 * Date filter applies to call_date by default. (If you want followup_date, change fieldName.)
 */
exports.getAllFollowUps = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const q = req.query || {};
    // Base where for followups
    const where = { clinic_id: clinicId ,status:  'followup' };
    if (q.patientId) where.patient_id = q.patientId;

    // Date filter on call_date (change to 'followup_date' if preferred)
    const dateWhere = buildDateWhere(q, 'call_date');
    if (dateWhere) Object.assign(where, dateWhere);

    // If lead filters provided, first find matching patientIds from Lead table
    const leadWhere = buildLeadWhere(q);
    if (Object.keys(leadWhere).length) {
      const matchingLeads = await Lead.findAll({ where: leadWhere, attributes: ['patientId'] });
      const patientIds = matchingLeads.map(l => l.patientId);
      if (!patientIds.length) return res.json([]); // no leads match -> empty result
      where.patient_id = { [Op.in]: patientIds };
    }

    // Fetch followups
    const followups = await LeadFollowUp.findAll({ where, order: [['call_date', 'DESC']] });
    const patientIdsInResults = Array.from(new Set(followups.map(f => f.patient_id).filter(Boolean)));

    // Fetch leads for those patientIds in bulk and map them
    const leadsMap = await fetchLeadsMapByPatientIds(patientIdsInResults);

    // Merge lead fields into followup objects
    const result = followups.map(f => {
      const plain = f.toJSON();
      const lead = leadsMap[plain.patient_id] || {};
      return {
        ...plain,
        female_name: lead.female_name || 'N/A',
        male_name: lead.male_name || 'N/A',
        primary_mobile: lead.primary_mobile || null,
        email: lead.email || null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching follow-ups:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /leadappointments
 * Date filter applies to appointment_date
 */
exports.getAllAppointments = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const q = req.query || {};
    const where = { clinic_id: clinicId };
    if (q.patientId) where.patient_id = q.patientId;

    const dateWhere = buildDateWhere(q, 'appointment_date');
    if (dateWhere) Object.assign(where, dateWhere);

    // lead filters -> limit patient_ids
    const leadWhere = buildLeadWhere(q);
    if (Object.keys(leadWhere).length) {
      const matchingLeads = await Lead.findAll({ where: leadWhere, attributes: ['patientId'] });
      const patientIds = matchingLeads.map(l => l.patientId);
      if (!patientIds.length) return res.json([]);
      where.patient_id = { [Op.in]: patientIds };
    }

    const appts = await LeadAppointment.findAll({ where, order: [['appointment_date', 'DESC']] });
    const patientIdsInResults = Array.from(new Set(appts.map(a => a.patient_id).filter(Boolean)));
    const leadsMap = await fetchLeadsMapByPatientIds(patientIdsInResults);

    const result = appts.map(a => {
      const plain = a.toJSON();
      const lead = leadsMap[plain.patient_id] || {};
      return {
        ...plain,
        female_name: lead.female_name || 'N/A',
        male_name: lead.male_name || 'N/A',
        primary_mobile: lead.primary_mobile || null,
        email: lead.email || null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /visits
 * Date filter applies to visit_date
 */
exports.getVisits = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const q = req.query || {};
    const where = { clinic_id: clinicId };
    if (q.patientId) where.patient_id = q.patientId;

    const dateWhere = buildDateWhere(q, 'visit_date');
    if (dateWhere) Object.assign(where, dateWhere);

    const leadWhere = buildLeadWhere(q);
    if (Object.keys(leadWhere).length) {
      const matchingLeads = await Lead.findAll({ where: leadWhere, attributes: ['patientId'] });
      const patientIds = matchingLeads.map(l => l.patientId);
      if (!patientIds.length) return res.json([]);
      where.patient_id = { [Op.in]: patientIds };
    }

    const visits = await LeadVisited.findAll({ where, order: [['visit_date', 'DESC']] });
    const patientIdsInResults = Array.from(new Set(visits.map(v => v.patient_id).filter(Boolean)));
    const leadsMap = await fetchLeadsMapByPatientIds(patientIdsInResults);

    const result = visits.map(v => {
      const plain = v.toJSON();
      const lead = leadsMap[plain.patient_id] || {};
      return {
        ...plain,
        female_name: lead.female_name || 'N/A',
        male_name: lead.male_name || 'N/A',
        primary_mobile: lead.primary_mobile || null,
        email: lead.email || null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching visits:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /conversions
 * Date filter applies to booking_date
 */
exports.getConversions = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

    const q = req.query || {};
    const where = { clinic_id: clinicId };
    if (q.patientId) where.patient_id = q.patientId;

    const dateWhere = buildDateWhere(q, 'booking_date');
    if (dateWhere) Object.assign(where, dateWhere);

    const leadWhere = buildLeadWhere(q);
    if (Object.keys(leadWhere).length) {
      const matchingLeads = await Lead.findAll({ where: leadWhere, attributes: ['patientId'] });
      const patientIds = matchingLeads.map(l => l.patientId);
      if (!patientIds.length) return res.json([]);
      where.patient_id = { [Op.in]: patientIds };
    }

    const conv = await LeadConverted.findAll({ where, order: [['booking_date', 'DESC']] });
    const patientIdsInResults = Array.from(new Set(conv.map(c => c.patient_id).filter(Boolean)));
    const leadsMap = await fetchLeadsMapByPatientIds(patientIdsInResults);

    const result = conv.map(c => {
      const plain = c.toJSON();
      const lead = leadsMap[plain.patient_id] || {};
      return {
        ...plain,
        female_name: lead.female_name || 'N/A',
        male_name: lead.male_name || 'N/A',
        primary_mobile: lead.primary_mobile || null,
        email: lead.email || null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Error fetching conversions:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getCRMDashboardStats = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = buildDateWhere({ startDate, endDate }, 'createdAt');
    
    // Get counts for all sections
    const [
      totalLeads,
      totalFollowUps,
      totalAppointments,
      totalVisits,
      totalConversions,
      todayFollowUps,
      todayAppointments,
      revenueData
    ] = await Promise.all([
      // Total Leads
      Lead.count({
        where: { clinic_id: clinicId, ...dateFilter }
      }),
      
      // Total Follow Ups
      LeadFollowUp.count({
        where: { 
          clinic_id: clinicId,
          status: 'followup',
          ...dateFilter 
        }
      }),
      
      // Total Appointments
      LeadAppointment.count({
        where: { clinic_id: clinicId, ...dateFilter }
      }),
      
      // Total Visits
      LeadVisited.count({
        where: { clinic_id: clinicId, ...dateFilter }
      }),
      
      // Total Conversions
      LeadConverted.count({
        where: { clinic_id: clinicId, ...dateFilter }
      }),
      
      // Today's Follow Ups
      LeadFollowUp.count({
        where: {
          clinic_id: clinicId,
          status: 'followup',
          followup_date: new Date().toISOString().split('T')[0]
        }
      }),
      
      // Today's Appointments
      LeadAppointment.count({
        where: {
          clinic_id: clinicId,
          appointment_date: new Date().toISOString().split('T')[0],
          status: 'Scheduled'
        }
      }),
      
      // Revenue Data
      LeadConverted.findOne({
        attributes: [
          [fn('SUM', col('package_price')), 'totalRevenue'],
          [fn('SUM', col('discount')), 'totalDiscount']
        ],
        where: { clinic_id: clinicId, ...dateFilter },
        raw: true
      })
    ]);

    // Calculate monthly revenue
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenue = await LeadConverted.findOne({
      attributes: [
        [fn('SUM', col('package_price')), 'monthRevenue'],
        [fn('SUM', col('discount')), 'monthDiscount']
      ],
      where: {
        clinic_id: clinicId,
        booking_date: {
          [Op.gte]: currentMonthStart.toISOString()
        }
      },
      raw: true
    });

    return res.status(200).json({
      totalLeads,
      totalFollowUps,
      totalAppointments,
      totalVisits,
      totalConversions,
      todayFollowUps,
      todayAppointments,
      totalRevenue: parseFloat(revenueData?.totalRevenue || 0),
      totalDiscount: parseFloat(revenueData?.totalDiscount || 0),
      monthRevenue: parseFloat(monthlyRevenue?.monthRevenue || 0),
      monthDiscount: parseFloat(monthlyRevenue?.monthDiscount || 0)
    });

  } catch (error) {
    console.error('Error fetching CRM dashboard stats:', error);
    return res.status(500).json({ message: 'Failed to fetch dashboard statistics' });
  }
};


exports.saveAgent = async (req, res) => {
  console.log('saveAgent body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id; // use clinic_id from logged-in user

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    let { name, contact } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('name');
    if (!contact || !/^\d{10}$/.test(contact)) missingFields.push('contact');

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing or invalid fields: ' + missingFields.join(', ')
      });
    }

    let agent;
    if (req.body.id) {
      // Update existing agent (only within same clinic)
      agent = await Agent.update(
        {
          name: name.trim(),
          contact: contact.trim()
        },
        {
          where: { id: req.body.id, clinic_id: clinicId }, // include clinic_id for security
          returning: true
        }
      );
      agent = agent[1][0];
    } else {
      // Create new agent
      agent = await Agent.create({
        clinic_id: clinicId,
        name: name.trim(),
        contact: contact.trim(),
        created_by: username || String(userId)
      });
    }

    return res.status(201).json({
      message: 'Agent saved successfully',
      agent
    });

  } catch (error) {
    console.error('Error saving agent:', error);
    return res.status(500).json({ message: 'Failed to save agent' });
  }
};

// Get all agents for this clinic
exports.getAgents = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const agents = await Agent.findAll({
      where: { clinic_id: clinicId },
      order: [['name', 'ASC']]
    });

    return res.json({ agents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return res.status(500).json({ message: 'Failed to fetch agents' });
  }
};

// Get agent by ID (only within same clinic)
exports.getAgentById = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const agent = await Agent.findOne({ where: { id, clinic_id: clinicId } });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    return res.json({
      id: agent.id,
      name: agent.name,
      contact: agent.contact
    });
  } catch (error) {
    console.error('Error fetching agent by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch agent details' });
  }
};

// Update agent (only within same clinic)
exports.updateAgent = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;
  const { name, contact } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const agent = await Agent.findOne({ where: { id, clinic_id: clinicId } });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    const updatedData = {
      name: name ?? agent.name,
      contact: contact ?? agent.contact
    };

    await agent.update(updatedData);

    return res.json({
      message: 'Agent updated successfully',
      agent: {
        id: agent.id,
        name: agent.name,
        contact: agent.contact
      },
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return res.status(500).json({ message: 'Failed to update agent' });
  }
};



