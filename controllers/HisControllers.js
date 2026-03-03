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
  EMR
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

exports.savePatientData = async (req, res) => {
  console.log(req.body);
  console.log(req.file);
  let { id } = req.query;
  if (id) {
    id = decryptData(id);
  }

  const clinicId = req.user?.clinic_id || id;

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  const transaction = await sequelize.transaction(); // Start a DB transaction

  try {
    const {
      patientId, // For updating an existing patient
      name,
      mobile,
      email,
      gender,
      bloodGroup,
      age,
      address,
      otdetails,
      weight,
      height,
      bmi,
      fever,
      bp,
      sugar,
      Clinic,
      doctor, // doctor_id for appointment
      date, // appointment date
      time, // appointment time slot
    } = req.body;

    if (!name || !mobile || !gender || !age || !bloodGroup) {
      return res
        .status(400)
        .json({ message: "Name, mobile, gender, and age are required." });
    }

    const patientImage = req.file?.path ? path.basename(req.file.path) : null;
    let patient;
    let isNewPatient = false;

    if (patientId) {
      // Update existing patient
      const decryptedId = decryptData(patientId);
      patient = await Patient.findOne({
        where: { id: decryptedId, clinic_id: clinicId },
      });

      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      await patient.update(
        {
          name,
          patientImage: patientImage || patient.patientImage, // Keep existing image if not provided
          mobile,
          email,
          gender,
          bloodGroup,
          age,
        },
        { transaction }
      );

      // Update or create patient details
      let patientDetails = await PatientDetails.findOne({
        where: { patient_id: decryptedId },
      });

      if (patientDetails) {
        await patientDetails.update(
          { address: address || null, otdetails: otdetails || null },
          { transaction }
        );
      } else {
        await PatientDetails.create(
          {
            patient_id: patientId,
            address: address || null,
            otdetails: otdetails || null,
          },
          { transaction }
        );
      }
    } else {
      // Create new patient record
      const existingPatient = await Patient.findOne({
        where: { mobile, clinic_id: clinicId },
      });

      if (existingPatient) {
        return res.status(409).json({
          message: "A patient with this mobile number already exists.",
        });
      }

      isNewPatient = true;
      patient = await Patient.create(
        {
          clinic_id: clinicId,
          name,
          patientImage,
          mobile,
          email,
          gender,
          bloodGroup,
          age,
        },
        { transaction }
      );

      // Generate UHID: UHID{clinicId}{YYYYMMDD}{patient_id}
      const todayDate = moment().format("YYYYMMDD");
      const uhid = `UHID${clinicId}${todayDate}${patient.id}`;

      await patient.update({ uhid }, { transaction });

      // Create patient details if provided
      if (address || otdetails) {
        await PatientDetails.create(
          {
            patient_id: patient.id,
            address: address || null,
            otdetails: otdetails || null,
          },
          { transaction }
        );
      }
    }

    let appointment = null;

    // Only create an appointment for new patients
    if (isNewPatient && doctor && date && time) {
      // Validate if doctor exists
      const doctorExists = await Doctor.findOne({
        where: { id: doctor, clinic_id: clinicId },
      });
      if (!doctorExists) {
        throw new Error("Invalid doctor ID");
      }

      const appointmentDate = moment(date, "YYYY-MM-DD", true);
      if (!appointmentDate.isValid()) {
        throw new Error("Invalid date format. Use YYYY-MM-DD");
      }

      // Check if the same patient already has an appointment with the same doctor at the same time
      const existingAppointment = await Appointment.findOne({
        where: {
          patient_id: patient.id,
          doctor_id: doctor,
          date: appointmentDate,
          time,
        },
      });

      if (existingAppointment) {
        throw new Error(
          "An appointment already exists for this patient with the same doctor at this time."
        );
      }

      appointment = await Appointment.create(
        {
          clinic_id: clinicId,
          patient_id: patient.id,
          doctor_id: doctor,
          doctor: doctorExists.name,
          clinic: Clinic,
          date: appointmentDate.toDate(),
          time,
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

    // Commit transaction
    await transaction.commit();

    return res.status(201).json({
      message: isNewPatient
        ? appointment
          ? "Patient and appointment data saved successfully"
          : "Patient data saved successfully"
        : "Patient data updated successfully",
      patient,
      ...(appointment ? { appointment } : {}), // Include appointment only if created
    });
  } catch (error) {
    console.error("Error saving patient data:", error);

    await transaction.rollback(); // Rollback transaction on failure
    return res
      .status(500)
      .json({ message: error.message || "Failed to save patient data" });
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

exports.getDoctorById = async (req, res) => {
  try {
    const { id: encryptedId } = req.query;
    if (!encryptedId) {
      return res.status(400).json({ success: false, message: "Missing id" });
    }

    // 1. decrypt the incoming ID
    let decrypted;
    try {
      decrypted = decryptData(encryptedId);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid id" });
    }

    // 2. fetch the doctor
    const doctor = await Doctor.findOne({
      where: {
        id: decrypted,
        clinic_id: req.user.clinic_id
      },
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
        "opd",
        "otherDetails",
        "appointmentCalendar",
        "timeslot"
      ]
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    // 3. send back JSON
    return res.json({
      success: true,
      doctor: {
        id:           doctor.id,         // keep encrypted for round‑trip
        name:         doctor.name,
        doctorImage:  doctor.doctorImage,
        phoneNumber:  doctor.phoneNumber,
        email:        doctor.email,
        gender:       doctor.gender,
        practicingSince: doctor.practicingSince,
        qualification:   doctor.qualification,
        specialization:  doctor.specialization,
        regNo:           doctor.regNo,
        consultationFees:doctor.consultationFees,
        ipd:             doctor.ipd,
        opd:             doctor.opd,
        otherDetails:    doctor.otherDetails,
        appointmentCalendar: doctor.appointmentCalendar,
        timeslot:        doctor.timeslot
      }
    });
  } catch (error) {
    console.error("Error in getDoctorById:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
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
