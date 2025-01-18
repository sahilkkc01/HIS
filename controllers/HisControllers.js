const md5 = require("md5");
const jwt = require("jsonwebtoken");
const moment = require('moment'); // For date formatting
const path = require('path');
const JWT_SECRET = "Sahilkkc01";
const sjcl = require("sjcl");
const { Op } = require("sequelize");
const {sequelize} = require('../db')

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

const { Patient, User, UserTokens, Clinic, Doctor, Specialization, Appointment, PatientDetails } = require('../models/HisSchema'); 

exports.verifyToken = async (req, res, next) => {
    console.log(req.user)
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
        return res.status(409).json({ msg: "User is already logged in elsewhere.",username:user.username });
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
      console.log(user)
      res.status(200).json({
        msg: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          clinic_id:user.clinic_id,
          name:user.name
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
      res.clearCookie("token", { httpOnly: true, secure: true, sameSite: "Strict" });
  
      console.log(`Token cleared for user: ${decoded.username}`);
      return res.status(200).json({ msg: "Logout successful" });
    } catch (err) {
      console.error("Error during logout:", err);
      return res.status(401).json({ msg: "Failed to authenticate token" });
    }
  };
  
exports.logoutFromEverywhere = async (req,res)=>{
    console.log(req.body);
    try {
      const { username } = req.body;
  
      console.log(req.body)
  
      const user = await User.findOne({
        where: {
          username: username,
          status: true,
        },
      });
  
      await UserTokens.destroy({
        where: { username: user.username },
      });
  
      res.status(200).json({msg:'Logout successful'})
    
    } catch (error) {
      
    }
  }

  exports.savePatientData = async (req, res) => {
    console.log(req.body);
    console.log(req.file);
  
    const clinicId = req.user?.clinic_id; 
  
    if (!clinicId) {
      return res.status(401).json({ message: 'Unauthorized: Please log in' });
    }
  
    const transaction = await sequelize.transaction(); // Start a DB transaction
  
    try {
      const {
        name,
        mobile,
        email,
        gender,
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
  
      if (!name || !mobile || !gender || !age) {
        return res.status(400).json({ message: 'Name, mobile, gender, and age are required.' });
      }
  
      const existingPatient = await Patient.findOne({ where: { mobile, clinic_id: clinicId } });
      if (existingPatient) {
        return res.status(409).json({ message: 'A patient with this mobile number already exists.' });
      }
  
      const patientImage = req.file?.path ? path.basename(req.file.path) : null;
  
      // Create new patient record
      const newPatient = await Patient.create(
        {
          clinic_id: clinicId,
          name,
          patientImage,
          mobile,
          email,
          gender,
          age,
        },
        { transaction }
      );
  
      // Generate UHID: UHID{clinicId}{YYYYMMDD}{patient_id}
      const todayDate = moment().format('YYYYMMDD');
      const uhid = `UHID${clinicId}${todayDate}${newPatient.id}`;
  
      // Update the patient record with UHID
      await newPatient.update({ uhid }, { transaction });
  
      // Save patient details if address or otdetails exist
      if (address || otdetails) {
        await PatientDetails.create(
          {
            patient_id: newPatient.id,
            address: address || null,
            otdetails: otdetails || null,
          },
          { transaction }
        );
      }
  
      let appointment = null;
  
      if (doctor && date && time) {
        // Validate if doctor exists
        const doctorExists = await Doctor.findOne({ where: { id: doctor, clinic_id: clinicId } });
        if (!doctorExists) {
          throw new Error('Invalid doctor ID');
        }
  
        const appointmentDate = moment(date, 'YYYY-MM-DD', true);
        if (!appointmentDate.isValid()) {
          throw new Error('Invalid date format. Use YYYY-MM-DD');
        }
  
        // Check if the same patient already has an appointment with the same doctor at the same time
        const existingAppointment = await Appointment.findOne({
          where: { patient_id: newPatient.id, doctor_id: doctor, date: appointmentDate, time },
        });
  
        if (existingAppointment) {
          throw new Error('An appointment already exists for this patient with the same doctor at this time.');
        }
  
        appointment = await Appointment.create(
          {
            clinic_id: clinicId,
            patient_id: newPatient.id,
            doctor_id: doctor,
            doctor:doctorExists.name,
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
        message: appointment
          ? 'Patient and appointment data saved successfully'
          : 'Patient data saved successfully',
        patient: newPatient,
        ...(appointment ? { appointment } : {}), // Include appointment only if created
      });
    } catch (error) {
      console.error('Error saving patient data:', error);
  
      await transaction.rollback(); // Rollback transaction on failure
      return res.status(500).json({ message: error.message || 'Failed to save patient data' });
    }
  };

exports.saveDoctorData = async (req, res) => {
  console.log(req.body);
  console.log(req.file);
  const clinicId = req.user.clinic_id;  // Get clinic_id from session
  if (clinicId==null) {
    return res.status(400).send({ msg: 'Please login' });
  }
  try {
      const {
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

      // Validate required fields
      if (!name || !phoneNumber) {
          return res.status(400).json({ message: 'Name and phone number are required.' });
      }
      const existingDoctor = await Doctor.findOne({ where: { phoneNumber, clinic_id: clinicId } });
      if (existingDoctor) {
          return res.status(400).json({ message: 'A doctor with this mobile number already exists.' });
      }
     const doctorImage= req.file ? path.basename(req.file.path) : null
      // Create new doctor record
      const newDoctor = await Doctor.create({
          clinic_id:clinicId, 
          name,
          doctorImage,
          phoneNumber,
          email,
          gender,
          practicingSince,
          qualification,
          specialization,
          regNo,
          consultationFees,
          opd: opd === 'true', // Convert string to boolean
          ipd: ipd === 'true', // Convert string to boolean
          otherDetails,
          appointmentCalendar: appointmentCalendar ? JSON.parse(appointmentCalendar) : null, // Parse JSON if provided
          timeslot
      });

      return res.status(201).json({ message: 'Doctor data saved successfully', doctor: newDoctor });
  } catch (error) {
      console.error('Error saving doctor data:', error);
      return res.status(500).json({ message: 'Failed to save doctor data' });
  }
};

exports.saveClinicData = async (req, res) => {
  console.log(req.body);
  console.log(req.files);
  const clinicId = req.user.clinic_id;  // Get clinic_id from session
  if (clinicId == null) {
    return res.status(400).send({ msg: 'Please login' });
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
      return res.status(400).json({ message: 'Name, contact number, email, and registration number are required.' });
    }

    // Check if clinic with same email or registration number exists
    const existingClinic = await Clinic.findOne({ where: { reg_no, clinic_id: clinicId } });

    if (existingClinic) {
      return res.status(400).json({ message: 'A clinic with this registration number already exists.' });
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
      ipd_service: ipd_service === 'true', // Convert string to boolean if coming from form data
      no_of_beds: parseInt(no_of_beds, 10), // Convert string to number if coming from form data
      emergency_services: emergency_services === '1',
      ambulance_service: ambulance_service === '1',
      TPA: TPA === '1',
    });

    return res.status(201).json({ message: 'Clinic data saved successfully', clinic: newClinic });
  } catch (error) {
    console.error('Error saving clinic data:', error);
    return res.status(500).json({ message: 'Failed to save clinic data' });
  }
};


exports.addSpecialization = async (req, res) => {
  const { spec } = req.body;
  const clinicId = req.user.clinic_id;  // Get clinic_id from session

  // Check if clinicId is available
  if (!clinicId) {
    return res.status(400).send({ msg: 'Please login' });
  }

  // Validate if specialty name is provided
  if (!spec) {
    return res.status(400).json({ message: 'Specialty is required' });
  }

  try {
    // Check if the specialization already exists for the clinic
    const existingSpecialty = await Specialization.findOne({ 
      where: { name: spec, clinic_id: clinicId } 
    });

    if (existingSpecialty) {
      return res.status(400).json({ message: 'Specialty already exists for this clinic' });
    }

    // Create new specialty if it doesn't exist
    const newSpecialty = await Specialization.create({ name: spec, clinic_id: clinicId });
    res.status(200).json({ message: 'Specialty added successfully', specialty: newSpecialty });
  } catch (error) {
    console.error('Error adding specialty:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.getDataFromField = async (req, res) => {
  const { elementId } = req.query;  // Schema name passed in the URL
  const clinicId = req.user.clinic_id;  // Get clinic_id from session or token

  // Check if clinic_id exists
  if (!clinicId) {
    return res.status(400).send({ msg: 'Please login' });
  }

  // Check if elementId is provided
  if (!elementId) {
    return res.status(400).send({ msg: 'Schema name is required' });
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
        clinic_id: clinicId  // Filter by clinic_id
      }
    });
    // console.log(data)

    // Return the data as a response
    res.status(200).json({ message: 'Data fetched successfully', data });
  } catch (error) {
    console.error('Error fetching data from schema:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};



exports.getAvailableSlots = async (req, res) => {
  try {
    console.log(req.body);
    const { doctor_id, date } = req.body;

    if (!doctor_id || !date) {
      return res.status(400).json({ message: "Doctor ID and date are required." });
    }

    // Fetch doctor availability & timeslot from DB
    const doctor = await Doctor.findOne({
      where: { id: doctor_id },
      attributes: ["appointmentCalendar", "timeslot"]
    });

    if (!doctor || !doctor.appointmentCalendar) {
      return res.status(404).json({ message: "Doctor availability not found." });
    }

    const availability = doctor.appointmentCalendar; // JSON format from DB
    const timeslot = doctor.timeslot || 15; // Default 15 minutes slot

    // Extract the day of the week from the given date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

    if (!availability[dayOfWeek] || availability[dayOfWeek].length === 0) {
      return res.status(200).json({ message: "Doctor is not available on this day.", availableSlots: [] });
    }

    // Fetch booked appointments for the doctor on the given date
    const bookedAppointments = await Appointment.findAll({
      where: {
        doctor_id,
        date
      },
      attributes: ["time"] // Fetch only time slots
    });

    console.log(bookedAppointments);
    const bookedSlots = bookedAppointments.map(apt => apt.time); // Array of booked slot strings

    // Generate available slots based on availability
    let availableSlots = [];

    availability[dayOfWeek].forEach(slot => {
      let fromTime = convertToMinutes(slot.fromTime);
      let toTime = convertToMinutes(slot.toTime);

      // Generate slots based on availability
      while (fromTime + timeslot <= toTime) {
        const slotStr = convertToTimeString(fromTime) + "-" + convertToTimeString(fromTime + timeslot);
console.log(slotStr)
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


exports.getAllPatientsWithLatestAppointment = async (req, res) => {
  try {
    // Fetch all patients
    const patients = await Patient.findAll({
      where:{clinic_id:req.user.clinic_id},
      attributes: ["id", "name", "mobile", "uhid","patientImage"]
    });

    if (!patients.length) {
      return res.status(404).json({ message: "No patients found." });
    }

    // Fetch latest appointment for each patient
    const patientsWithAppointments = await Promise.all(
      patients.map(async (patient) => {
        const latestAppointment = await Appointment.findOne({
          where: { patient_id: patient.id },
          order: [["date", "DESC"], ["time", "DESC"]], // Latest date & time first
          attributes: ["clinic", "doctor", "date", "time"]
        });

        const encId = encryptDataForUrl(patient.id.toString());
        return {
          id: encId,
          name: patient.name,
          mobile: patient.mobile,
          uhid: patient.uhid,
          patientImage:patient.patientImage,
          latestAppointment: latestAppointment || null
        };
      })
    );

    return res.status(200).json({ patients: patientsWithAppointments });

  } catch (error) {
    console.error("Error fetching patients with appointments:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


//Get Specific Patient Data

exports.getPatientData = async (req, res) => {
  const { patientId } = req.params; // Get patient ID from request parameters
  const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

  if (!clinicId) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }

  try {
    // Fetch patient record
    const patient = await Patient.findOne({
      where: { id: patientId, clinic_id: clinicId },
    });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    // Fetch patient details separately using patient_id
    const patientDetails = await PatientDetails.findOne({
      where: { patient_id: patientId },
    });

    // Combine patient data with details manually
    const patientData = {
      ...patient.toJSON(),
      address: patientDetails?.address || null,
      otdetails: patientDetails?.otdetails || null,
    };

    return res.status(200).json({ patient: patientData });
  } catch (error) {
    console.error('Error fetching patient data:', error);
    return res.status(500).json({ message: 'Failed to fetch patient data' });
  }
};