const md5 = require("md5");
const jwt = require("jsonwebtoken");
const JWT_SECRET = "Sahilkkc01";
const { Patient, User, UserTokens, Clinic } = require('../models/HisSchema'); 

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

// Controller to save patient data
exports.savePatientData = async (req, res) => {
    console.log(req.body)
    console.log(req.file)
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
            fever,
            bp,
            sugar
        } = req.body;

        // Validate required fields
        if (!name || !mobile || !gender || !age) {
            return res.status(400).json({ message: 'Name, mobile, gender, and age are required.' });
        }

        
        // Create new patient record
        const newPatient = await Patient.create({
            clinic_id,
            name,
            mobile,
            email,        
            gender,
            age,
        });

        return res.status(201).json({ message: 'Patient data saved successfully', patient: newPatient });
    } catch (error) {
        console.error('Error saving patient data:', error);
        return res.status(500).json({ message: 'Failed to save patient data' });
    }
};

exports.saveClinicData = async (req, res) => {
  console.log(req.body);
  console.log(req.files);

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

      // Create a new clinic record
      const newClinic = await Clinic.create({
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
