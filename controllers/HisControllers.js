const md5 = require("md5");
const jwt = require("jsonwebtoken");
const moment = require("moment"); // For date formatting
const path = require("path");
const JWT_SECRET = "Sahilkkc01";
const sjcl = require("sjcl");
const { Op } = require("sequelize");
const { sequelize } = require("../db");


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

const {
  Patient,
  User,
  UserTokens,
  Clinic,
  Doctor,
  Specialization,
  Appointment,
  PatientDetails,
  Items,
  Service,
  ItemDetails,
  Package,
  Department,
  Employee,
  Molecule,
  ItemBrandName,
  Store,
  EMR,
  Source,
  Counselor,
  Treatment,
   SpouseDetails, SponsorInfo, BankDetails,
} = require("../models/HisSchema");

exports.verifyToken = async (req, res, next) => {
  console.log(req.user);
  const token = req.cookies.token; // Read token from HttpOnly cookie
  console.log(token);

  if (!token) {
    return res.redirect("/login");
  }
  const user = await UserTokens.findOne({ where: { jwtToken: token } });

  if (!user) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user details to req.user
    res.locals.user = req.user; // Make user available in templates
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  console.log(req.body);

  try {
    // Step 1: Verify user credentials
    const user = await User.findOne({
      where: {
        username: username,
        status: true,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const inputPasswordHash = md5(password);
    if (user.password !== inputPasswordHash) {
      return res.status(401).json({ msg: "Invalid username or password" });
    }

    // Step 3: Check if user is already logged in elsewhere
    const existingToken = await UserTokens.findOne({
      where: { username: user.username },
    });

    if (existingToken) {
      // await UserTokens.destroy({ where: { userId: user.id } });
      return res.status(409).json({
        msg: "User is already logged in elsewhere.",
        username: user.username,
      });
    }

    // Step 4: Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        clinic_id: user.clinic_id,
        username: user.username,
        name: user.name,
      },
      JWT_SECRET // Secret key stored in environment variable
    );

    // Step 5: Store token in HttpOnly cookie
    res.cookie("token", token, {
      maxAge: 6 * 30 * 24 * 60 * 60 * 1000,
    });

    // Step 6: Save token in UserTokens table
    await UserTokens.create({
      username: user.username,
      jwtToken: token,
    });

    // Step 7: Send final login response
    console.log(user);
    res.status(200).json({
      msg: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        clinic_id: user.clinic_id,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ msg: "Error during login" });
  }
};

exports.logout = async (req, res) => {
  const token = req.cookies.token; // Get token from HttpOnly cookie

  if (!token) {
    return res.status(400).json({ msg: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log(`Decoded token:`, decoded);

    // Find and delete the token from the UserTokens table (if applicable)
    // Uncomment if you are storing tokens in the database

    await UserTokens.destroy({
      where: { username: decoded.username, jwtToken: token },
    });

    // Clear the token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
    });

    console.log(`Token cleared for user: ${decoded.username}`);
    return res.status(200).json({ msg: "Logout successful" });
  } catch (err) {
    console.error("Error during logout:", err);
    return res.status(401).json({ msg: "Failed to authenticate token" });
  }
};

exports.logoutFromEverywhere = async (req, res) => {
  console.log(req.body);
  try {
    const { username } = req.body;

    console.log(req.body);

    const user = await User.findOne({
      where: {
        username: username,
        status: true,
      },
    });

    await UserTokens.destroy({
      where: { username: user.username },
    });

    res.status(200).json({ msg: "Logout successful" });
  } catch (error) {}
};

exports.getMasterAdmin = async (req, res) => {
  const userId   = req.user?.id;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const admin = await User.findOne({
      where: {
        clinic_id: clinicId,
        master: 1
      }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Master admin not found' });
    }

    res.json({ name: admin.name });
  } catch (error) {
    console.error('Error fetching master admin:', error);
    res.status(500).json({ message: 'Failed to fetch master admin' });
  }
};




exports.savePatientData = async (req, res) => {
  console.log(req.body);
  console.log(req.files);
  const transaction = await sequelize.transaction();

  try {
    let { id } = req.query;
    if (id) id = decryptData(id);
    const clinicId = req.user?.clinic_id || id;
    if (!clinicId) return res.status(401).json({ message: "Unauthorized" });

    const {
      patientId,
      uhid,

      prefix, firstName, middleName, lastName, familyName, fatherName,
      gender, bloodGroup, dob, age,
      education, maritalStatus, anniversary, religion,

      mobile: phone1, phone2, email,
      occupation, companyName,

      idProof, specialReg, address, state, city, country,
      status: statusRaw,

      spousePrefix, spouseFirstName, spouseMiddleName, spouseLastName,
      spouseFamilyName, spouseMotherName,
      spouseDob, spouseAge, spouseEducation, spouseBloodGroup,
      spouseOccupation, spouseCompanyName, spouseIncome,
      spouseExperience, spouseSkill, spouseVehicle,
      languages: languagesRaw,

      referenceNo, patientCategory, associatedCompany,
      memberRelation, patientSource, sponsorCompany, tariff, remark,

      bankName, branch, ifscCode, accountNo, accountHolder, accountType,

      weight, height, bmi, fever, bp, sugar,
      place, doctor, drtime: time, date,
      Clinic,
    } = req.body;

    if (!firstName || !phone1 || !gender || !age || !bloodGroup) {
      await transaction.rollback();
      return res.status(400).json({ message: "Required fields missing" });
    }

    const statusArr = Array.isArray(statusRaw)
      ? statusRaw
      : typeof statusRaw === "string"
      ? statusRaw.split(",")
      : [];

    const isInternational = statusArr.includes("international");
    const isVIP = statusArr.includes("vip");
    const isEmployee = statusArr.includes("employee");
    const isInsured = statusArr.includes("insured");

    const languages = Array.isArray(languagesRaw)
      ? languagesRaw
      : typeof languagesRaw === "string"
      ? languagesRaw.split(",")
      : [];

    const patientImage = req.files?.patientImage?.[0]?.path
      ? path.basename(req.files.patientImage[0].path)
      : null;

    const spouseImage = req.files?.spouseImage?.[0]?.path
      ? path.basename(req.files.spouseImage[0].path)
      : null;

    const hasSpouse = req.body.hasSpouse === "1";
    const hasBankSponsor = req.body.hasBankSponsor === "1";
    const hasAppointment = req.body.hasAppointment === "1";

    let patient;
    let isNewPatient = false;

    if (patientId) {
      const decryptedId = decryptData(patientId);

      patient = await Patient.findOne({
        where: { id: decryptedId, clinic_id: clinicId },
      });

      if (!patient) {
        await transaction.rollback();
        return res.status(404).json({ message: "Patient not found" });
      }

      await patient.update(
        {
          uhid: uhid || null,
          prefix, firstName, middleName, lastName, familyName, fatherName,
          gender, bloodGroup, dob: dob || null, age,
          education, maritalStatus, anniversary: anniversary || null, religion,
          mobile: phone1, phone2, email,
          occupation, companyName,
          idProof, specialReg: specialReg === "Yes",
          address, state, city, country: country || "India",
          isInternational, isVIP, isEmployee, isInsured,
          ...(patientImage ? { patientImage } : {}),
        },
        { transaction }
      );

    } else {
      const existing = await Patient.findOne({
        where: { mobile: phone1, clinic_id: clinicId },
      });

      if (existing) {
        await transaction.rollback();
        return res.status(409).json({ message: "Mobile already exists" });
      }

      if (uhid) {
        const existingUHID = await Patient.findOne({
          where: { uhid, clinic_id: clinicId },
        });
        if (existingUHID) {
          await transaction.rollback();
          return res.status(409).json({ message: "UHID already exists" });
        }
      }

      isNewPatient = true;

      patient = await Patient.create(
        {
          clinic_id: clinicId,
          uhid: uhid || null,
          prefix, firstName, middleName, lastName, familyName, fatherName,
          gender, bloodGroup, dob: dob || null, age,
          education, maritalStatus, anniversary: anniversary || null, religion,
          mobile: phone1, phone2, email,
          occupation, companyName,
          idProof, specialReg: specialReg === "Yes",
          address, state, city, country: country || "India",
          isInternational, isVIP, isEmployee, isInsured,
          patientImage,
        },
        { transaction }
      );
    }

    if (hasSpouse && spouseFirstName) {
      const spouseData = {
        prefix: spousePrefix, firstName: spouseFirstName,
        middleName: spouseMiddleName, lastName: spouseLastName,
        familyName: spouseFamilyName, motherName: spouseMotherName,
        dob: spouseDob || null, age: spouseAge || null,
        education: spouseEducation, bloodGroup: spouseBloodGroup,
        occupation: spouseOccupation, companyName: spouseCompanyName,
        monthlyIncome: spouseIncome, workExperience: spouseExperience,
        skill: spouseSkill, vehicleType: spouseVehicle,
        languages,
        ...(spouseImage ? { spouseImage } : {}),
      };

      const existingSpouse = await SpouseDetails.findOne({
        where: { patient_id: patient.id },
      });

      if (existingSpouse) {
        await existingSpouse.update(spouseData, { transaction });
      } else {
        await SpouseDetails.create(
          { patient_id: patient.id, ...spouseData },
          { transaction }
        );
      }
    }

    if (hasBankSponsor && (referenceNo || patientCategory)) {
      const sponsorData = {
        referenceNo, patientCategory, associatedCompany,
        memberRelation, patientSource, sponsorCompany, tariff, remark,
      };

      const existingSponsor = await SponsorInfo.findOne({
        where: { patient_id: patient.id },
      });

      if (existingSponsor) {
        await existingSponsor.update(sponsorData, { transaction });
      } else {
        await SponsorInfo.create(
          { patient_id: patient.id, ...sponsorData },
          { transaction }
        );
      }
    }

    if (hasBankSponsor && (bankName || accountNo)) {
      const bankData = { bankName, branch, ifscCode, accountNo, accountHolder, accountType };

      const existingBank = await BankDetails.findOne({
        where: { patient_id: patient.id },
      });

      if (existingBank) {
        await existingBank.update(bankData, { transaction });
      } else {
        await BankDetails.create(
          { patient_id: patient.id, ...bankData },
          { transaction }
        );
      }
    }

    let appointment = null;

    if (isNewPatient && hasAppointment && doctor && time) {
      const doctorExists = await Doctor.findOne({
        where: { id: doctor, clinic_id: clinicId },
      });
      if (!doctorExists) throw new Error("Invalid doctor");

      const appointmentDate = moment(date, "YYYY-MM-DD", true);
      if (!appointmentDate.isValid()) throw new Error("Invalid date");

      const dup = await Appointment.findOne({
        where: {
          patient_id: patient.id,
          doctor_id: doctor,
          date: appointmentDate.toDate(),
          time,
        },
      });
      if (dup) throw new Error("Appointment exists");

      appointment = await Appointment.create(
        {
          clinic_id: clinicId,
          patient_id: patient.id,
          doctor_id: doctor,
          doctor: doctorExists.name,
          clinic: Clinic,
          date: appointmentDate.toDate(),
          time,
          place,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          bmi: bmi ? parseFloat(bmi) : null,
          fever: fever || null,
          BP: bp || null,
          Suger: sugar || null,
        },
        { transaction }
      );
    }

    await transaction.commit();

    return res.status(201).json({
      message: isNewPatient ? "Patient created" : "Patient updated",
      patient,
      ...(appointment ? { appointment } : {}),
    });

  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ message: error.message || "Error" });
  }
};
exports.getPatientById = async (req, res) => {
  try {

   let { id } = req.query;
    if (!id) return res.status(400).json({ message: "Patient id required" });

    const clinicId = req.user?.clinic_id;
    if (!clinicId) return res.status(401).json({ message: "Unauthorized" });
    const patient = await Patient.findOne({
      where: { id, clinic_id: clinicId }
    });
    console.log('Patient:', patient);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const spouse = await SpouseDetails.findOne({
      where: { patient_id: id }
    });

    const sponsor = await SponsorInfo.findOne({
      where: { patient_id: id }
    });

    const bank = await BankDetails.findOne({
      where: { patient_id: id }
    });

    const appointments = await Appointment.findAll({
      where: { patient_id: id },
      order: [["createdAt", "DESC"]]
    });

    return res.status(200).json({
      patient,
      spouse,
      sponsor,
      bank,
      appointments
    });

  } catch (error) {
    console.error("getPatientById error:", error);
    return res.status(500).json({ message: error.message || "Error" });
  }
};
exports.saveDoctorData = async (req, res) => {
  const clinicId = req.user.clinic_id;
  if (!clinicId) {
    return res.status(400).json({ message: "Please login" });
  }

  try {
    const {
      doctorId, // plain numeric ID, or undefined/new
      name,
      phoneNumber,
      email,
      gender,
      practicingSince,
      qualification,
      specialization,
      regNo,
      consultationFees,
      opd,
      ipd,
      otherDetails,
      appointmentCalendar,
      timeslot
    } = req.body;

    if (!name || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Name and phone number are required." });
    }

    let targetDoctor = null;
    if (doctorId) {
      const id = parseInt(doctorId, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid doctor ID" });
      }
      targetDoctor = await Doctor.findOne({
        where: { id, clinic_id: clinicId }
      });
      if (!targetDoctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
    }

    // unique phone check, excluding current if updating
    const phoneConflict = await Doctor.findOne({
      where: {
        phoneNumber,
        clinic_id: clinicId,
        ...(targetDoctor && { id: { [Op.ne]: targetDoctor.id } })
      }
    });
    if (phoneConflict) {
      return res
        .status(400)
        .json({ message: "A doctor with this mobile number already exists." });
    }

    // build payload
    const payload = {
      clinic_id: clinicId,
      name,
      doctorImage: req.file
        ? path.basename(req.file.path)
        : targetDoctor?.doctorImage || null,
      phoneNumber,
      email,
      gender,
      practicingSince,
      qualification,
      specialization,
      regNo,
      consultationFees,
      opd: opd === "true",
      ipd: ipd === "true",
      otherDetails,
      appointmentCalendar: appointmentCalendar
        ? JSON.parse(appointmentCalendar)
        : null,
      timeslot
    };

    let doctor;
    if (targetDoctor) {
      // update existing
      await targetDoctor.update(payload);
      doctor = targetDoctor;
    } else {
      // create new
      doctor = await Doctor.create(payload);
    }

    return res.json({
      success: true,
      message: targetDoctor
        ? "Doctor updated successfully"
        : "Doctor created successfully",
      doctor
    });
  } catch (error) {
    console.error("Error saving doctor data:", error);
    return res.status(500).json({ message: "Failed to save doctor data" });
  }
};

exports.saveClinicData = async (req, res) => {
  console.log(req.body);
  console.log(req.files);
  const clinicId = req.user.clinic_id; // Get clinic_id from session
  if (clinicId == null) {
    return res.status(400).send({ msg: "Please login" });
  }
  try {
    const {
      name,
      contact_no,
      email,
      reg_no,
      address,
      OperatingDetails,
      ipd_service,
      no_of_beds,
      emergency_services,
      ambulance_service,
      TPA,
    } = req.body;

    const logo = req.files?.logo?.[0]?.filename || null;
    const header_image = req.files?.header_image?.[0]?.filename || null;
    const footer_image = req.files?.footer_image?.[0]?.filename || null;

    // Validate required fields
    if (!name || !contact_no || !email || !reg_no) {
      return res.status(400).json({
        message:
          "Name, contact number, email, and registration number are required.",
      });
    }

    // Check if clinic with same email or registration number exists
    const existingClinic = await Clinic.findOne({
      where: { reg_no, clinic_id: clinicId },
    });

    if (existingClinic) {
      return res.status(400).json({
        message: "A clinic with this registration number already exists.",
      });
    }

    // Create a new clinic record
    const newClinic = await Clinic.create({
      clinic_id: clinicId,
      name,
      contact_no,
      email,
      reg_no,
      address,
      OperatingDetails,
      logo,
      header_image,
      footer_image,
      ipd_service: ipd_service === "true", // Convert string to boolean if coming from form data
      no_of_beds: parseInt(no_of_beds, 10), // Convert string to number if coming from form data
      emergency_services: emergency_services === "1",
      ambulance_service: ambulance_service === "1",
      TPA: TPA === "1",
    });

    return res
      .status(201)
      .json({ message: "Clinic data saved successfully", clinic: newClinic });
  } catch (error) {
    console.error("Error saving clinic data:", error);
    return res.status(500).json({ message: "Failed to save clinic data" });
  }
};

exports.addSpecialization = async (req, res) => {
  console.log(req.user);
  const { spec } = req.body;
  const clinicId = req.user.clinic_id; // Get clinic_id from session

  // Check if clinicId is available
  if (!clinicId) {
    return res.status(400).send({ msg: "Please login" });
  }

  // Validate if specialty name is provided
  if (!spec) {
    return res.status(400).json({ message: "Specialty is required" });
  }

  try {
    // Check if the specialization already exists for the clinic
    const existingSpecialty = await Specialization.findOne({
      where: { name: spec, clinic_id: clinicId },
    });

    if (existingSpecialty) {
      return res
        .status(400)
        .json({ message: "Specialty already exists for this clinic" });
    }

    // Create new specialty if it doesn't exist
    const newSpecialty = await Specialization.create({
      name: spec,
      clinic_id: clinicId,
    });
    res.status(200).json({
      message: "Specialty added successfully",
      specialty: newSpecialty,
    });
  } catch (error) {
    console.error("Error adding specialty:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.addDepartment = async (req, res) => {
  const { dept } = req.body;
  const clinicId = req.user.clinic_id; // Get clinic_id from session

  // Check if clinicId is available
  if (!clinicId) {
    return res.status(400).send({ msg: "Please login" });
  }

  // Validate if specialty name is provided
  if (!dept) {
    return res.status(400).json({ message: "Department is required" });
  }

  try {
    // Check if the specialization already exists for the clinic
    const existingDepartment = await Department.findOne({
      where: { name: dept, clinic_id: clinicId },
    });

    if (existingDepartment) {
      return res
        .status(400)
        .json({ message: "Department already exists for this clinic" });
    }

    // Create new specialty if it doesn't exist
    const newDepartment = await Department.create({
      name: dept,
      clinic_id: clinicId,
    });
    res.status(200).json({
      message: "Department added successfully",
      dept: newDepartment,
    });
  } catch (error) {
    console.error("Error adding department:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getDataFromField = async (req, res) => {
  const { elementId } = req.query; // Schema name passed in the URL
  const clinicId = req.user.clinic_id; // Get clinic_id from session or token

  // Check if clinic_id exists
  if (!clinicId) {
    return res.status(400).send({ msg: "Please login" });
  }

  // Check if elementId is provided
  if (!elementId) {
    return res.status(400).send({ msg: "Schema name is required" });
  }

  try {
    // Dynamically import the schema model based on the schema name
    const model = require("../models/HisSchema")[elementId]; // Assuming the models are in the 'models' folder

    if (!model) {
      return res.status(404).send({ msg: `Schema ${elementId} not found` });
    }

    // Fetch all records from the schema for the given clinic_id
    const data = await model.findAll({
      where: {
        clinic_id: clinicId, // Filter by clinic_id
      },
    });
    // console.log(data)

    // Return the data as a response
    res.status(200).json({ message: "Data fetched successfully", data });
  } catch (error) {
    console.error("Error fetching data from schema:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    console.log(req.body);
    const { doctor_id, date } = req.body;

    if (!doctor_id || !date) {
      return res
        .status(400)
        .json({ message: "Doctor ID and date are required." });
    }

    // Fetch doctor availability & timeslot from DB
    const doctor = await Doctor.findOne({
      where: { id: doctor_id },
      attributes: ["appointmentCalendar", "timeslot"],
    });

    if (!doctor || !doctor.appointmentCalendar) {
      return res
        .status(404)
        .json({ message: "Doctor availability not found." });
    }

    const availability = doctor.appointmentCalendar; // JSON format from DB
    const timeslot = doctor.timeslot || 15; // Default 15 minutes slot

    // Extract the day of the week from the given date
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });

    if (!availability[dayOfWeek] || availability[dayOfWeek].length === 0) {
      return res.status(200).json({
        message: "Doctor is not available on this day.",
        availableSlots: [],
      });
    }

    // Fetch booked appointments for the doctor on the given date
    const bookedAppointments = await Appointment.findAll({
      where: {
        doctor_id,
        date,
      },
      attributes: ["time"], // Fetch only time slots
    });

    console.log(bookedAppointments);
    const bookedSlots = bookedAppointments.map((apt) => apt.time); // Array of booked slot strings

    // Generate available slots based on availability
    let availableSlots = [];

    availability[dayOfWeek].forEach((slot) => {
      let fromTime = convertToMinutes(slot.fromTime);
      let toTime = convertToMinutes(slot.toTime);

      // Generate slots based on availability
      while (fromTime + timeslot <= toTime) {
        const slotStr =
          convertToTimeString(fromTime) +
          "-" +
          convertToTimeString(fromTime + timeslot);
        console.log(slotStr);
        // Exclude already booked slots
        if (!bookedSlots.includes(slotStr)) {
          availableSlots.push(slotStr);
        }

        fromTime += timeslot;
      }
    });

    return res.status(200).json({ availableSlots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Helper function to convert "HH:MM" to total minutes
const convertToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert total minutes to "HH:MM AM/PM"
const convertToTimeString = (totalMinutes) => {
  let hours = Math.floor(totalMinutes / 60);
  let minutes = totalMinutes % 60;
  let period = hours >= 12 ? "PM" : "AM";

  // Convert to 12-hour format
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12; // Handle 12 AM case

  return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

exports.getPatientsWithLatestAppointment = async (req, res) => {
  try {
    // pagination
    let page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
    let limit = Math.max(1, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    // search filters
    const { name = "", email = "", mobile = "" } = req.query;
    const where = { clinic_id: req.user.clinic_id };

    if (name.trim()) {
      where.name = { [Op.like]: `%${name.trim()}%` };
    }
    if (email.trim()) {
      where.email = { [Op.like]: `%${email.trim()}%` };
    }
    if (mobile.trim()) {
      where.mobile = { [Op.like]: `%${mobile.trim()}%` };
    }

    // fetch patients + count
    const { rows: patients, count: totalPatients } =
      await Patient.findAndCountAll({
        where,
        attributes: ["id", "uhid", "name", "email", "mobile", "patientImage"],
        order: [["id", "DESC"]],
        limit,
        offset
      });

    // redirect if page out of bounds
    if (!patients.length && page > 1) {
      const qs = new URLSearchParams({
        page:  "1",
        limit: limit.toString(),
        ...(name.trim()  && { name: name.trim() }),
        ...(email.trim() && { email: email.trim() }),
        ...(mobile.trim()&& { mobile: mobile.trim() })
      }).toString();
      return res.redirect(`/patients-with-appointments?${qs}`);
    }

    // attach latest appointment
    const patientsWithAppointments = await Promise.all(
      patients.map(async (p) => {
        const appt = await Appointment.findOne({
          where: { patient_id: p.id },
          order: [
            ["date", "DESC"],
            ["time", "DESC"]
          ],
          attributes: ["clinic", "doctor", "date", "time"]
        });
        return {
          id:        encryptDataForUrl(p.id.toString()),
          uhid:      p.uhid,
          name:      p.name,
          email:     p.email,
          mobile:    p.mobile,
          patientImage: p.patientImage,
          latestAppointment: appt || null
        };
      })
    );

    // send JSON
    return res.json({
      success: true,
      patients: patientsWithAppointments,
      pagination: {
        totalPatients,
        totalPages:  Math.ceil(totalPatients / limit),
        currentPage: page,
        perPage:     limit
      }
    });
  } catch (error) {
    console.error("Error fetching patients with appointments:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

//Get Specific Patient Data

exports.getPatientData = async (req, res) => {
  const { patientId } = req.params; // Get patient ID from request parameters
  const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }
  const decryptedId = decryptData(patientId);
  console.log(decryptedId);
  try {
    // Fetch patient record
    const patient = await Patient.findOne({
      where: { id: decryptedId, clinic_id: clinicId },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Fetch patient details separately using patient_id
    const patientDetails = await PatientDetails.findOne({
      where: { patient_id: decryptedId },
    });

    // Combine patient data with details manually
    const patientData = {
      ...patient.toJSON(),
      id: patientId, // Replace the patient id with the encrypted version
      address: patientDetails?.address || null,
      otdetails: patientDetails?.otdetails || null,
    };

    return res.status(200).json({ patient: patientData });
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return res.status(500).json({ message: "Failed to fetch patient data" });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.query;
    console.log("Fetching appointments for Doctor ID:", doctorId);

    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    // Fetch all appointments for the doctor
    const appointments = await Appointment.findAll({
      where: { doctor_id: doctorId },
      order: [
        ["date", "ASC"],
        ["time", "ASC"],
      ],
    });

    if (appointments.length === 0) {
      return res.json([]); // Return empty array if no appointments
    }

    // Extract unique patient IDs
    const patientIds = appointments.map((app) => app.patient_id);

    // Fetch patient details separately (avoid associations)
    const patients = await Patient.findAll({
      where: { id: { [Op.in]: patientIds } },
      attributes: ["id", "name", "age", "gender"],
    });

    // Convert patients list to a map for quick lookup
    const patientMap = {};
    patients.forEach((patient) => {
      patientMap[patient.id] = patient;
    });

    // Format the final response
    const formattedAppointments = appointments.map((app) => {
      const patient = patientMap[app.patient_id] || {};
      return {
        date: app.date,
        time: app.time,
        patientName: patient.name || "Unknown",
        age: patient.age || null,
        gender: patient.gender || null,
      };
    });

    res.json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.saveItems = async (req, res) => {
  console.log(req.body);
  const t = await sequelize.transaction(); // Start a transaction
  try {
    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    const {
      itemId, // Used for update
      medicine_name,
      generic_name,
      brand_name,
      dosage_form,
      strength,
      manufacturer,
      cost_price,
      sell_price,
      storage_condition,
      prescription_req,
      interactions,
      category,
      molecule,
      mrp,
      gst,
      uom,
      strength_unit,
      other_uom,
      hsn,
      conversion,
    } = req.body;

    if (!medicine_name || !molecule || !uom || !mrp || !category || !gst || !cost_price) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    const itemImage = req.file?.path ? path.basename(req.file.path) : null;
    const prqst = prescription_req === "Yes"; // Convert "Yes" to `true`, otherwise `false`

    let item;
    if (itemId) {
      // **Update existing item**
      item = await Items.findOne({ where: { id: itemId, clinic_id: clinicId }, transaction: t });

      if (!item) {
        await t.rollback();
        return res.status(404).json({ message: "Item not found" });
      }

      await item.update(
        { medicine_name, generic_name, cost_price, molecule, mrp, gst, uom, category },
        { transaction: t }
      );

      // **Update or Create ItemDetails**
      let itemDetails = await ItemDetails.findOne({ where: { item_id: itemId }, transaction: t });

      if (itemDetails) {
        await itemDetails.update(
          {
            brand_name,
            dosage_form,
            strength,
            manufacturer,
            sell_price: sell_price ? parseFloat(sell_price) : null,
            storage_condition,
            prescription_req: prqst,
            interactions,
            item_img: itemImage ? itemImage : itemDetails.item_img, // Retain existing image if not updated
            strength_unit,
            other_uom,
            hsn,
            conversion: conversion ? conversion : null,
          },
          { transaction: t }
        );
      } else {
        await ItemDetails.create(
          {
            item_id: itemId,
            brand_name,
            dosage_form,
            strength,
            manufacturer,
            sell_price: sell_price ? parseFloat(sell_price) : null,
            storage_condition,
            prescription_req: prqst,
            interactions,
            item_img: itemImage,
            strength_unit,
            other_uom,
            hsn,
            conversion: conversion ? conversion : null,
          },
          { transaction: t }
        );
      }

      await t.commit();
      return res.status(200).json({ message: "Medicine updated successfully", item });

    } else {
      // **Create a new item**
      const existingItem = await Items.findOne({
        where: { clinic_id: clinicId, medicine_name },
        transaction: t,
      });

      if (existingItem) {
        await t.rollback();
        return res.status(400).json({ message: "Item with the same medicine name already exists" });
      }

      item = await Items.create(
        { clinic_id: clinicId, medicine_name, generic_name, cost_price, molecule, mrp, gst, uom, category },
        { transaction: t }
      );

      await ItemDetails.create(
        {
          item_id: item.id,
          brand_name,
          dosage_form,
          strength,
          manufacturer,
          sell_price: sell_price ? parseFloat(sell_price) : null,
          storage_condition,
          prescription_req: prqst,
          interactions,
          item_img: itemImage,
          strength_unit,
          other_uom,
          hsn,
          conversion: conversion ? conversion : null,
        },
        { transaction: t }
      );

      await t.commit();
      return res.status(201).json({ message: "Medicine added successfully", item });
    }
  } catch (error) {
    await t.rollback();
    console.error("Error saving items:", error);
    res.status(500).json({ error: "Failed to save items" });
  }
};




exports.saveService = async (req, res) => {
  try {
    const { service_name, service_category, cost, special_inst } = req.body;
    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user
    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // Check if a service with the same service_name already exists in the clinic
    const existingService = await Service.findOne({
      where: { clinic_id: clinicId, service_name },
    });

    if (existingService) {
      return res
        .status(400)
        .json({ message: "Service with the same name already exists" });
    }

    // Create a new service since there is no duplicate
    const newService = await Service.create({
      clinic_id: clinicId,
      service_name,
      service_category,
      cost,
      special_inst,
    });

    res.status(200).json({ message: "Service Added Successfully", newService });
  } catch (error) {
    console.error("Error saving services:", error);
    res.status(500).json({ error: "Failed to save services" });
  }
};

exports.savePackage = async (req, res) => {
  try {
    const {
      package_code,
      package_name,
      package_validity,
      cost,
      services,
      medicines,
      service_cost,
      medicine_cost,
      tax,
      discount,
      terms_conditions,
    } = req.body;
    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user
    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // Check if a package with the same package_name or package_code already exists in the clinic
    const existingPackage = await Package.findOne({
      where: {
        clinic_id: clinicId,
        [Op.or]: [{ package_name }, { package_code }],
      },
    });

    if (existingPackage) {
      return res
        .status(400)
        .json({ message: "Package name or package code already exists" });
    }

    // Create a new package since there is no duplicate
    const newPackage = await Package.create({
      clinic_id: clinicId,
      package_code,
      package_name,
      package_validity,
      cost,
      services,
      medicines,
      service_cost,
      medicine_cost,
      tax,
      discount,
      terms_conditions,
    });

    res.status(200).json({ message: "Package Added Successfully", newPackage });
  } catch (error) {
    console.error("Error saving packages:", error);
    res.status(500).json({ error: "Failed to save packages" });
  }
};

exports.saveEmployeeData = async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  const clinicId = req.user.clinic_id; // Get clinic_id from session
  if (clinicId == null) {
    return res.status(400).send({ msg: "Please login" });
  }

  try {
    const {
      empId,
      name,
      dob,
      gender,
      phoneNumber,
      email,
      address,
      dept,
      desg,
      doj,
      qualification,
      exp,
      specialization,
      shiftTimming,
      emerCont,
      emerContMobile,
    } = req.body;

    // Validate required fields
    if (!empId || !name || !phoneNumber) {
      return res
        .status(400)
        .json({ message: "Employee ID, name, and phone number are required." });
    }

    const existingEmployee = await Employee.findOne({
      where: { empId, clinic_id: clinicId },
    });
    if (existingEmployee) {
      return res
        .status(400)
        .json({ message: "An employee with this ID already exists." });
    }

    const empImage = req.file ? path.basename(req.file.path) : null;

    // Convert empty date values to null
    const formattedDob = dob && dob.trim() !== "" ? dob : null;
    const formattedDoj = doj && doj.trim() !== "" ? doj : null;

    // Create new employee record
    const newEmployee = await Employee.create({
      clinic_id: clinicId,
      empId,
      name,
      dob: formattedDob,
      gender,
      phoneNumber,
      email,
      address,
      dept,
      desg,
      doj: formattedDoj,
      qualification,
      exp,
      specialization,
      shiftTimming,
      emerCont,
      emerContMobile,
      empImage,
    });

    return res.status(201).json({
      message: "Employee data saved successfully",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("Error saving employee data:", error);
    return res.status(500).json({ message: "Failed to save employee data" });
  }
};

exports.addNewModal = async (req, res) => {
  const { name, tableName } = req.body;

  console.log(req.body)
  const clinicId = req.user.clinic_id; // Get clinic_id from session

  // Check if clinicId is available
  if (!clinicId) {
    return res.status(400).send({ msg: "Please login" });
  }

  // Validate if specialty name is provided
  if (!name) {
    return res.status(400).json({ message: `${tableName} is required` });
  }

  try {
    const model = require("../models/HisSchema")[tableName]; // Assuming the models are in the 'models' folder

    if (!model) {
      return res.status(404).send({ msg: `Schema ${tableName} not found` });
    }
    // Check if the specialization already exists for the clinic
    const existingRow = await model.findOne({
      where: { name: name, clinic_id: clinicId },
    });

    if (existingRow) {
      return res
        .status(400)
        .json({ message: `${tableName} already exists for this clinic` });
    }

    // Create new specialty if it doesn't exist
    const newRow = await model.create({
      name: name,
      clinic_id: clinicId,
    });
    res.status(200).json({
      message: `${tableName} added successfully`,
      specialty: newRow,
    });
  } catch (error) {
    console.error(`Error adding ${tableName}:`, error);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.PatientFilter = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    const { uhid, mobile, email } = req.query;

    // Check if no parameters are provided
    if (!uhid && !mobile && !email) {
      return res.status(404).json({ message: "No search value provided" });
    }

    let whereClause = { clinic_id: clinicId };

    if (uhid) whereClause.uhid = uhid;
    if (mobile) whereClause.mobile = mobile;
    if (email) whereClause.email = email;

    let patient = await Patient.findOne({ where: whereClause });

    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ message: "Patient not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getAllDoctors = async (req, res) => {
  try {
    // fetch all doctors for this clinic
    const doctors = await Doctor.findAll({
      where: { clinic_id: req.user.clinic_id },
      attributes: [
        "id",
        "name",
        "doctorImage",
        "phoneNumber",
        "email",
        "gender",
        "practicingSince",
        "qualification",
        "specialization",
        "regNo",
        "consultationFees",
        "ipd",
        "opd"
      ],
      order: [["name", "ASC"]],
    });

    // mask the ID
    const payload = doctors.map((d) => ({
      id:           encryptDataForUrl(d.id.toString()),
      name:         d.name,
      image:        d.doctorImage,
      phoneNumber:  d.phoneNumber,
      email:        d.email,
      gender:       d.gender,
      practicingSince: d.practicingSince,
      qualification:   d.qualification,
      specialization:  d.specialization,
      regNo:           d.regNo,
      consultationFees:d.consultationFees,
      ipd:             d.ipd,
      opd:             d.opd,
    }));

    return res.json({ success: true, doctors: payload });
  } catch (err) {
    console.error("Error fetching doctors:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


exports.searchMedicine = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const q = (req.query.q || '').trim();

  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }
  if (!q) {
    return res.json([]);  // no query → empty list
  }

  try {
    const items = await Items.findAll({
      attributes: [
        'id',
        'medicine_name',
        'generic_name',
        'molecule',
        'cost_price',
        'mrp',
        'gst',
        'uom',
        'category',
      ],
      where: {
        clinic_id: clinicId,
        [Op.or]: [
          // simple LIKE; default MySQL collation is usually case-insensitive
          { medicine_name: { [Op.like]: `%${q}%` } },
          { molecule:      { [Op.like]: `%${q}%` } },
          // if you need to force case-insensitive regardless of collation, you can instead do:
          // where(fn('LOWER', col('medicine_name')), Op.like, `%${q.toLowerCase()}%`),
          // where(fn('LOWER', col('molecule')),      Op.like, `%${q.toLowerCase()}%`),
        ],
      },
      order: [['medicine_name', 'ASC']],
      limit: 20,
    });

    return res.json(items);
  } catch (error) {
    console.error('Item search error:', error);
    return res.status(500).json({ message: 'Search failed' });
  }
};


exports.saveEmr = async (req, res) => {
  try {
    // 1. Pull encrypted patientId and other fields
    const {
      patient_id: encryptedPatientId,
      clinicalHistory,
      pulse,
      bp,
      temp,
      spo2,
      diagnosis,
      tests,
      prescriptions,
      doctorsAdvice,
      nextFollowUp
    } = req.body;

    // 2. Decrypt the patient ID
    const patientId = decryptData(encryptedPatientId);
    if (!patientId) {
      return res.status(400).json({ message: 'Invalid patient ID' });
    }

    // 3. Auth context
    const clinicId = req.user?.clinic_id;
    const doneBy   = req.user?.username;
    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // 4. Create the EMR record
    const newEmr = await EMR.create({
      clinic_id:       clinicId,
      patient_id:      patientId,
      doneBy,
      clinicalHistory,
      pulse,
      bp,
      temp,
      spo2,
      diagnosis,
      tests,           // JSON or TEXT column
      prescriptions,   // JSON column
      doctorsAdvice,
      nextFollowUp
    });

    return res
      .status(200)
      .json({ message: "EMR Saved Successfully", emr: newEmr });

  } catch (error) {
    console.error("Error saving EMR:", error);
    return res.status(500).json({ message: "Failed to save EMR" });
  }
};



exports.saveClinic = async (req, res) => {
  console.log('saveClinic body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    let { name, contact, address } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('name');
    if (!contact || !/^\d{10}$/.test(contact)) missingFields.push('contact');
    if (!address || !address.trim()) missingFields.push('address');

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing or invalid fields: ' + missingFields.join(', ')
      });
    }

    let clinic;
    if (req.body.id) {
      // Update existing clinic
      clinic = await Clinic.update(
        {
          name: name.trim(),
          contact: contact.trim(),
          address: address.trim()
        },
        {
          where: { id: req.body.id, clinic_id: clinicId }, // include clinic_id for security
          returning: true
        }
      );
      clinic = clinic[1][0]; // Sequelize returns [affectedCount, [rows]]
    } else {
      // Create new clinic
      clinic = await Clinic.create({
        clinic_id: clinicId,
        name: name.trim(),
        contact: contact.trim(),
        address: address.trim(),
        created_by: username || String(userId)
      });
    }

    return res.status(201).json({
      message: 'Clinic saved successfully',
      clinic
    });

  } catch (error) {
    console.error('Error saving clinic:', error);
    return res.status(500).json({ message: 'Failed to save clinic' });
  }
};


// Get all clinics
exports.getClinics = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const clinics = await Clinic.findAll({
      order: [['name', 'ASC']]
    });

    return res.json({ clinics });
  } catch (error) {
    console.error('Error fetching clinics:', error);
    return res.status(500).json({ message: 'Failed to fetch clinics' });
  }
};

// Get clinic by ID
exports.getClinicById = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const clinic = await Clinic.findOne({ where: { id } });

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    return res.json({
      id: clinic.id,
      name: clinic.name,
      contact: clinic.contact,
      address: clinic.address
    });
  } catch (error) {
    console.error('Error fetching clinic by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch clinic details' });
  }
};

// Update clinic
exports.updateClinic = async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { name, contact, address } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const clinic = await Clinic.findOne({ where: { id } });

    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const updatedData = {
      name: name ?? clinic.name,
      contact: contact ?? clinic.contact,
      address: address ?? clinic.address
    };

    await clinic.update(updatedData);

    return res.json({
      message: 'Clinic updated successfully',
      clinic: {
        id: clinic.id,
        name: clinic.name,
        contact: clinic.contact,
        address: clinic.address
      },
    });
  } catch (error) {
    console.error('Error updating clinic:', error);
    return res.status(500).json({ message: 'Failed to update clinic' });
  }
};


exports.saveSource = async (req, res) => {
  console.log('saveSource body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    let { id, name } = req.body;

    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('name');

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing or invalid fields: ' + missingFields.join(', ')
      });
    }

    let source;
    if (id) {
      // Update existing source (secure by clinic_id)
      source = await Source.update(
        { name: name.trim() },
        {
          where: { id, clinic_id: clinicId },
          returning: true
        }
      );
      source = source[1][0];
    } else {
      // Create new source
      source = await Source.create({
        clinic_id: clinicId,
        name: name.trim(),
        created_by: username || String(userId)
      });
    }

    return res.status(201).json({
      message: 'Source saved successfully',
      source
    });

  } catch (error) {
    console.error('Error saving source:', error);
    return res.status(500).json({ message: 'Failed to save source' });
  }
};

// Get all sources for the clinic
exports.getSources = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const sources = await Source.findAll({
      where: { clinic_id: clinicId },
      order: [['name', 'ASC']]
    });

    return res.json({ sources });
  } catch (error) {
    console.error('Error fetching sources:', error);
    return res.status(500).json({ message: 'Failed to fetch sources' });
  }
};

// Get source by ID (within clinic)
exports.getSourceById = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const source = await Source.findOne({ where: { id, clinic_id: clinicId } });

    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    return res.json({
      id: source.id,
      name: source.name
    });
  } catch (error) {
    console.error('Error fetching source by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch source details' });
  }
};

// Update source (within clinic)
exports.updateSource = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;
  const { name } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const source = await Source.findOne({ where: { id, clinic_id: clinicId } });

    if (!source) {
      return res.status(404).json({ message: 'Source not found' });
    }

    const updatedData = {
      name: name ?? source.name
    };

    await source.update(updatedData);

    return res.json({
      message: 'Source updated successfully',
      source: {
        id: source.id,
        name: source.name
      },
    });
  } catch (error) {
    console.error('Error updating source:', error);
    return res.status(500).json({ message: 'Failed to update source' });
  }
};

exports.saveDoctor = async (req, res) => {
  console.log('saveDoctor body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    let { name, contact, availability } = req.body;

    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('name');
    if (!contact || !/^\d{10}$/.test(contact)) missingFields.push('contact');

    // Validate availability: must have start/end for each day
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    if (!availability || typeof availability !== 'object') {
      missingFields.push('availability');
    } else {
      days.forEach(day => {
        if (!availability[day] || !availability[day].start || !availability[day].end) {
          // only warn if both are missing? For optional days, you can skip
          if(day !== 'Saturday' && day !== 'Sunday'){ // optional weekend
            missingFields.push(`availability.${day}`);
          }
        }
      });
    }

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing or invalid fields: ' + missingFields.join(', ')
      });
    }

    // Save or update
    let doctor;
    if (req.body.id) {
      doctor = await Doctor.update({
        name: name.trim(),
        contact: contact.trim(),
        availability
      }, {
        where: { id: req.body.id, clinic_id: clinicId },
        returning: true
      });
      doctor = doctor[1][0]; // sequelize update returns [affectedCount, [rows]]
    } else {
      doctor = await Doctor.create({
        clinic_id: clinicId,
        name: name.trim(),
        contact: contact.trim(),
        availability,
        created_by: username || String(userId)
      });
    }

    return res.status(201).json({
      message: 'Doctor saved successfully',
      doctor
    });

  } catch (error) {
    console.error('Error saving doctor:', error);
    return res.status(500).json({ message: 'Failed to save doctor' });
  }
};

exports.getDoctors = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Fetch all doctors for this clinic
    const doctors = await Doctor.findAll({
      where: { clinic_id: clinicId },
      order: [['name', 'ASC']],
    });

    // Map doctors and parse availability if stored as JSON string
    const doctorsWithAvailability = doctors.map(d => {
      let availability = d.availability || {};
      try {
        if (typeof availability === 'string') {
          availability = JSON.parse(availability);
        }
      } catch (e) {
        availability = {};
      }

      return {
        id: d.id,
        name: d.name,
        contact: d.contact,
        availability
      };
    });

    return res.json({ doctors: doctorsWithAvailability });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    return res.status(500).json({ message: 'Failed to fetch doctors' });
  }
};

exports.getDoctorById = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Find doctor by ID and clinic_id
    const doctor = await Doctor.findOne({
      where: { id, clinic_id: clinicId }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Parse availability if stored as JSON string
    let availability = doctor.availability || {};
    try {
      if (typeof availability === 'string') {
        availability = JSON.parse(availability);
      }
    } catch (e) {
      availability = {};
    }

    return res.json({
      id: doctor.id,
      name: doctor.name,
      contact: doctor.contact,
      specialization: doctor.specialization,
      availability
    });
  } catch (error) {
    console.error('Error fetching doctor by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch doctor details' });
  }
};
exports.updateDoctor = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  console.log(req.params, req.body)
  const { id } = req.params;
  const { name, contact, specialization, availability } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Find doctor by ID and clinic_id
    const doctor = await Doctor.findOne({
      where: { id, clinic_id: clinicId }
    });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Prepare updated fields
    const updatedData = {
      name: name ?? doctor.name,
      contact: contact ?? doctor.contact,
      specialization: specialization ?? doctor.specialization,
      availability: availability
        ? typeof availability === 'object'
          ? JSON.stringify(availability)
          : availability
        : doctor.availability,
    };

    // Update doctor
    await doctor.update(updatedData);

    // Parse availability before sending response
    let parsedAvailability = updatedData.availability;
    try {
      if (typeof parsedAvailability === 'string') {
        parsedAvailability = JSON.parse(parsedAvailability);
      }
    } catch (e) {
      parsedAvailability = {};
    }

    return res.json({
      message: 'Doctor updated successfully',
      doctor: {
        id: doctor.id,
        name: doctor.name,
        contact: doctor.contact,
        specialization: doctor.specialization,
        availability: parsedAvailability,
      },
    });
  } catch (error) {
    console.error('Error updating doctor:', error);
    return res.status(500).json({ message: 'Failed to update doctor' });
  }
};

exports.saveTreatment = async (req, res) => {
  console.log('saveTreatment body:', req.body);

  const userId   = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    let { name } = req.body;

    // Validate required fields
    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('name');

    if (missingFields.length) {
      return res.status(400).json({
        message: 'Missing or invalid fields: ' + missingFields.join(', ')
      });
    }

    let treatment;
    if (req.body.id) {
      // Update existing treatment (secure by clinic_id)
      treatment = await Treatment.update(
        { name: name.trim() },
        {
          where: { id: req.body.id, clinic_id: clinicId },
          returning: true
        }
      );
      treatment = treatment[1][0];
    } else {
      // Create new treatment
      treatment = await Treatment.create({
        clinic_id: clinicId,
        name: name.trim(),
        created_by: username || String(userId)
      });
    }

    return res.status(201).json({
      message: 'Treatment saved successfully',
      treatment
    });

  } catch (error) {
    console.error('Error saving treatment:', error);
    return res.status(500).json({ message: 'Failed to save treatment' });
  }
};

// Get all treatments for the clinic
exports.getTreatments = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const treatments = await Treatment.findAll({
      where: { clinic_id: clinicId },
      order: [['name', 'ASC']]
    });

    return res.json({ treatments });
  } catch (error) {
    console.error('Error fetching treatments:', error);
    return res.status(500).json({ message: 'Failed to fetch treatments' });
  }
};

// Get treatment by ID (within clinic)
exports.getTreatmentById = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const treatment = await Treatment.findOne({ where: { id, clinic_id: clinicId } });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    return res.json({
      id: treatment.id,
      name: treatment.name
    });
  } catch (error) {
    console.error('Error fetching treatment by ID:', error);
    return res.status(500).json({ message: 'Failed to fetch treatment details' });
  }
};

// Update treatment (within clinic)
exports.updateTreatment = async (req, res) => {
  const userId = req.user?.id;
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;
  const { name } = req.body;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const treatment = await Treatment.findOne({ where: { id, clinic_id: clinicId } });

    if (!treatment) {
      return res.status(404).json({ message: 'Treatment not found' });
    }

    const updatedData = {
      name: name ?? treatment.name
    };

    await treatment.update(updatedData);

    return res.json({
      message: 'Treatment updated successfully',
      treatment: {
        id: treatment.id,
        name: treatment.name
      },
    });
  } catch (error) {
    console.error('Error updating treatment:', error);
    return res.status(500).json({ message: 'Failed to update treatment' });
  }
};


exports.saveCounselor = async (req, res) => {
  const userId = req.user?.id;
  const username = req.user?.username;
  const clinicId = req.user?.clinic_id;

  if (!userId || !clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    const { id, name, contact } = req.body;

    const missingFields = [];
    if (!name || !name.trim()) missingFields.push('name');
    if (!contact || !/^\d{10}$/.test(contact)) missingFields.push('contact');

    if (missingFields.length) {
      return res.status(400).json({ message: 'Missing or invalid fields: ' + missingFields.join(', ') });
    }

    let counselor;
    if (id) {
      // Update
      counselor = await Counselor.update(
        { name: name.trim(), contact: contact.trim() },
        { where: { id, clinic_id: clinicId }, returning: true }
      );
      counselor = counselor[1][0];
    } else {
      // Create
      counselor = await Counselor.create({
        clinic_id: clinicId,
        name: name.trim(),
        contact: contact.trim(),
        created_by: username || String(userId)
      });
    }

    return res.status(201).json({ message: 'Counselor saved successfully', counselor });
  } catch (err) {
    console.error('Error saving counselor:', err);
    return res.status(500).json({ message: 'Failed to save counselor' });
  }
};

// Get all counselors
exports.getCounselors = async (req, res) => {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

  try {
    const counselors = await Counselor.findAll({ where: { clinic_id: clinicId }, order: [['name','ASC']] });
    return res.json({ counselors });
  } catch (err) {
    console.error('Error fetching counselors:', err);
    return res.status(500).json({ message: 'Failed to fetch counselors' });
  }
};

// Get counselor by ID
exports.getCounselorById = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;

  if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

  try {
    const counselor = await Counselor.findOne({ where: { id, clinic_id: clinicId } });
    if (!counselor) return res.status(404).json({ message: 'Counselor not found' });

    return res.json({ id: counselor.id, name: counselor.name, contact: counselor.contact });
  } catch (err) {
    console.error('Error fetching counselor by ID:', err);
    return res.status(500).json({ message: 'Failed to fetch counselor details' });
  }
};

// Update counselor
exports.updateCounselor = async (req, res) => {
  const clinicId = req.user?.clinic_id;
  const { id } = req.params;
  const { name, contact } = req.body;

  if (!clinicId) return res.status(401).json({ message: 'Unauthorized: Please log in' });

  try {
    const counselor = await Counselor.findOne({ where: { id, clinic_id: clinicId } });
    if (!counselor) return res.status(404).json({ message: 'Counselor not found' });

    const updatedData = { name: name ?? counselor.name, contact: contact ?? counselor.contact };
    await counselor.update(updatedData);

    return res.json({ message: 'Counselor updated successfully', counselor: updatedData });
  } catch (err) {
    console.error('Error updating counselor:', err);
    return res.status(500).json({ message: 'Failed to update counselor' });
  }
};
