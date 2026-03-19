const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../db");

const Patient = sequelize.define(
  "patients",
  {
    clinic_id:       { type: DataTypes.INTEGER,      allowNull: false },
    uhid:            { type: DataTypes.STRING },
 
    // ── Name block ──────────────────────────
    prefix:          { type: DataTypes.ENUM("Mr.", "Mrs.", "Ms.", "Dr.") },
    firstName:       { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
    middleName:      { type: DataTypes.STRING },
    lastName:        { type: DataTypes.STRING },
    familyName:      { type: DataTypes.STRING },
    fatherName:      { type: DataTypes.STRING },
 
    // ── Demographics ────────────────────────
    gender:          { type: DataTypes.ENUM("Male", "Female", "Other"), allowNull: false },
    bloodGroup:      { type: DataTypes.ENUM("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"), allowNull: false },
    dob:             { type: DataTypes.DATEONLY },
    age:             { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0, max: 150 } },
    education:       { type: DataTypes.ENUM("High School", "Bachelor's", "Master's", "PhD") },
    maritalStatus:   { type: DataTypes.ENUM("Single", "Married", "Divorced", "Widowed") },
    anniversary:     { type: DataTypes.DATEONLY },
    religion:        { type: DataTypes.ENUM("Hindu", "Muslim", "Christian", "Sikh", "Other") },
 
    // ── Contact ─────────────────────────────
    mobile:          { type: DataTypes.STRING, allowNull: false, validate: { isNumeric: true, len: [10, 15] } },
    phone2:          { type: DataTypes.STRING },
    email:           { type: DataTypes.STRING,  validate: { isEmail: true } },
 
    // ── Professional ────────────────────────
    occupation:      { type: DataTypes.STRING },
    companyName:     { type: DataTypes.STRING },
 
    // ── Identity / misc ─────────────────────
    idProof:         { type: DataTypes.ENUM("Aadhar", "PAN", "Passport", "Driving License") },
    specialReg:      { type: DataTypes.BOOLEAN, defaultValue: false },
 
    // ── Address ─────────────────────────────
    address:         { type: DataTypes.TEXT },
    state:           { type: DataTypes.STRING },
    city:            { type: DataTypes.STRING },
    country:         { type: DataTypes.STRING, defaultValue: "India" },
 
    // ── Status flags ────────────────────────
    isInternational: { type: DataTypes.BOOLEAN, defaultValue: false },
    isVIP:           { type: DataTypes.BOOLEAN, defaultValue: false },
    isEmployee:      { type: DataTypes.BOOLEAN, defaultValue: false },
    isInsured:       { type: DataTypes.BOOLEAN, defaultValue: false },
 
    // ── Photo ───────────────────────────────
    patientImage:    { type: DataTypes.STRING },
  },
  { timestamps: true, alter: true, tableName: "patients" }
);
 
// ─────────────────────────────────────────────
//  2.  SPOUSE DETAILS
// ─────────────────────────────────────────────
const SpouseDetails = sequelize.define(
  "spouse_details",
  {
    patient_id:       { type: DataTypes.INTEGER, allowNull: false },
 
    // ── Name block ──────────────────────────
    prefix:           { type: DataTypes.ENUM("Mr.", "Mrs.", "Ms.", "Dr.") },
    firstName:        { type: DataTypes.STRING },
    middleName:       { type: DataTypes.STRING },
    lastName:         { type: DataTypes.STRING },
    familyName:       { type: DataTypes.STRING },
    motherName:       { type: DataTypes.STRING },
 
    // ── Demographics ────────────────────────
    dob:              { type: DataTypes.DATEONLY },
    age:              { type: DataTypes.INTEGER },
    education:        { type: DataTypes.ENUM("High School", "Bachelor's", "Master's", "PhD") },
    bloodGroup:       { type: DataTypes.ENUM("A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-") },
 
    // ── Professional ────────────────────────
    occupation:       { type: DataTypes.ENUM("Business", "Service", "Self-employed", "Other") },
    companyName:      { type: DataTypes.STRING },
    monthlyIncome:    {
                        type: DataTypes.ENUM(
                          "Below ₹25,000",
                          "₹25,000 - ₹50,000",
                          "₹50,000 - ₹1,00,000",
                          "Above ₹1,00,000"
                        )
                      },
    workExperience:   { type: DataTypes.ENUM("0-2 years", "3-5 years", "6-10 years", "10+ years") },
    skill:            { type: DataTypes.ENUM("Management", "Technical", "Creative", "Other") },
 
    // ── Other ───────────────────────────────
    languages:        { type: DataTypes.JSON },          // ["Hindi","English","Other"]
    vehicleType:      { type: DataTypes.ENUM("Two-wheeler", "Four-wheeler", "Other") },
 
    // ── Photo ───────────────────────────────
    spouseImage:      { type: DataTypes.STRING },
  },
  { timestamps: true, alter: true, tableName: "spouse_details" }
);
 
// ─────────────────────────────────────────────
//  3.  SPONSOR INFO
// ─────────────────────────────────────────────
const SponsorInfo = sequelize.define(
  "sponsor_info",
  {
    patient_id:        { type: DataTypes.INTEGER, allowNull: false },
    referenceNo:       { type: DataTypes.STRING },
    patientCategory:   { type: DataTypes.ENUM("General", "Corporate", "Insurance") },
    associatedCompany: { type: DataTypes.STRING },
    memberRelation:    { type: DataTypes.ENUM("Self", "Spouse", "Child", "Parent") },
    patientSource:     { type: DataTypes.ENUM("Referral", "Walk-in", "Online") },
    sponsorCompany:    { type: DataTypes.STRING },
    tariff:            { type: DataTypes.ENUM("Standard", "Premium", "Corporate") },
    remark:            { type: DataTypes.TEXT },
  },
  { timestamps: true, alter: true, tableName: "sponsor_info" }
);
 
// ─────────────────────────────────────────────
//  4.  BANK DETAILS
// ─────────────────────────────────────────────
const BankDetails = sequelize.define(
  "bank_details",
  {
    patient_id:     { type: DataTypes.INTEGER, allowNull: false },
    bankName:       { type: DataTypes.STRING },
    branch:         { type: DataTypes.STRING },
    ifscCode:       { type: DataTypes.STRING },
    accountNo:      { type: DataTypes.STRING },
    accountHolder:  { type: DataTypes.STRING },
    accountType:    { type: DataTypes.ENUM("saving", "current") },
  },
  { timestamps: true, alter: true, tableName: "bank_details" }
);
 
// ─────────────────────────────────────────────
//  Associations
// ─────────────────────────────────────────────

// Patient.sync({ force: true });
// SpouseDetails.sync({ force: true });
// SponsorInfo.sync({ force: true });
// BankDetails.sync({ force: true });

const PatientDetails = sequelize.define(
  "PatientDetails",
  {
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
    },
    otdetails: {
      type: DataTypes.TEXT,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "patientdetails",
  }
);

const Appointment = sequelize.define(
  "Appointment",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    weight: {
      type: DataTypes.FLOAT,
    },
    height: {
      type: DataTypes.FLOAT,
    },
    bmi: {
      type: DataTypes.FLOAT,
    },
    fever: {
      type: DataTypes.STRING,
    },
    BP: {
      type: DataTypes.STRING,
    },
    Suger: {
      type: DataTypes.STRING,
    },
    clinic: {
      type: DataTypes.STRING,
    },
    doctor_id: {
      type: DataTypes.INTEGER,
    },
    doctor: {
      type: DataTypes.STRING,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "appointments", // Name of the table in the database
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

const User = sequelize.define(
  "User",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: 1,
      allowNull: false,
    },
     master: {
        type: DataTypes.BOOLEAN,
        defaultValue: 0,
        allowNull: false,
      },
  },
  {
    timestamps: true,
    tableName: "users",
    alter: true,
  }
);
// User.sync({ alter: true });
const Clinic = sequelize.define('Clinic', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10}$/, // 10-digit phone number
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'clinics',
});
const Source = sequelize.define('Source', {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'sources',
  });
  // Source.sync({ alter: true });

const UserTokens = sequelize.define(
  "usertokens",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    jwtToken: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    tableName: "usertokens",
  }
);

const Doctor = sequelize.define('Doctor', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10}$/, // 10-digit phone number
    }
  },
  availability: {
    type: DataTypes.JSON, // stores start/end times for each day
    allowNull: true,
    // Example: { Monday: {start: "09:00", end: "17:00"}, Tuesday: {start: "09:00", end: "17:00"}, ... }
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'doctors',
});
// Doctor.sync({force:true})

const Specialization = sequelize.define(
  "Specialization",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "specialization",
  }
);
const Department = sequelize.define(
  "Department",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "department",
  }
);

const Package = sequelize.define(
  "Package",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    package_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    package_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    package_validity: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    services: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    medicines: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    service_cost: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    medicine_cost: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    tax: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    terms_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "package",
  }
);

const Service = sequelize.define(
  "Service",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    service_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    service_category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cost: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    special_inst: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "service",
  }
);

const ServiceCategory = sequelize.define(
  "ServiceCategory",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "servicecategory",
  }
);

// ServiceCategory.sync({ alter: true });
// Service.sync({ alter: true });

const Items = sequelize.define(
  "Items",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    medicine_name: {
      type: DataTypes.STRING,
    },
    generic_name: {
      type: DataTypes.STRING,
    },
    molecule: {
      type: DataTypes.STRING,
    },
    cost_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    mrp: {
      type: DataTypes.DECIMAL(10, 2),
    },
    gst: {
      type: DataTypes.DECIMAL(10, 2),
    },
    uom: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "items",
  }
);

const ItemDetails = sequelize.define(
  "ItemDetails",
  {
    item_id: {
      type: DataTypes.INTEGER,
    },
    brand_name: {
      type: DataTypes.STRING,
    },
    dosage_form: {
      type: DataTypes.STRING,
    },
    strength: {
      type: DataTypes.STRING,
    },
    strength_unit: {
      type: DataTypes.STRING,
    },
    manufacturer: {
      type: DataTypes.STRING,
    },
    sell_price: {
      type: DataTypes.DECIMAL(10, 2),
    },
    storage_condition: {
      type: DataTypes.STRING,
    },
    prescription_req: {
      type: DataTypes.BOOLEAN,
    },
    interactions: {
      type: DataTypes.TEXT,
    },
    item_img: {
      type: DataTypes.STRING,
    },
    other_uom: {
      type: DataTypes.STRING,
    },
    hsn: {
      type: DataTypes.STRING,
    },
    conversion: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "itemdetails",
  }
);

const Molecule = sequelize.define(
  "Molecule",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "molecule",
  }
);

const ItemBrandName = sequelize.define(
  "ItemBrandName",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "itembrandname",
  }
);

const ItemCategory = sequelize.define(
  "ItemCategory",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "itemcategory",
  }
);

const DosageForm = sequelize.define(
  "DosageForm",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "dosageform",
  }
);

const StrengthUnit = sequelize.define(
  "StrengthUnit",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "strengthunit",
  }
);

const Manufacturer = sequelize.define(
  "Manufacturer",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "manufacturer",
  }
);

const UOM = sequelize.define(
  "UOM",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "uom",
  }
);

const HSNCode = sequelize.define(
  "HSNCode",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "hsncode",
  }
);

const Employee = sequelize.define(
  "Employee",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    empId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("M", "F", "O"),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isNumeric: true,
        len: [10, 15],
      },
    },
    email: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.STRING,
    },
    dept: {
      type: DataTypes.STRING,
    },
    desg: {
      type: DataTypes.STRING,
    },
    doj: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    qualification: {
      type: DataTypes.STRING,
    },
    exp: {
      type: DataTypes.STRING,
    },
    specialization: {
      type: DataTypes.STRING,
    },
    shiftTimming: {
      type: DataTypes.STRING,
    },
    emerCont: {
      type: DataTypes.STRING,
    },
    emerContMobile: {
      type: DataTypes.STRING,
    },
    empImage: {
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "employees",
  }
);

const Store = sequelize.define(
  "Store",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "store",
  }
);

const EMR = sequelize.define(
  "EMR",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    clinicalHistory: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pulse: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    bp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    temp: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    spo2: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.STRING,
      allowNull: true, // Optional
    },
    tests: {
      type: DataTypes.JSON,
      allowNull: true, // Optional
    },
    prescriptions: {
      type: DataTypes.JSON,
      allowNull: true, // Optional
    },
    doctorsAdvice: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nextFollowUp: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    doneBy: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  },
  {
    timestamps: true,
    alter: true,
    tableName: "emr",
  }
);

const Counselor = sequelize.define('Counselor', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10}$/, // 10-digit phone number
    },
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'counselors',
});

 const Treatment = sequelize.define('Treatment', {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    timestamps: true,
    tableName: 'treatments',
  });


// EMR.sync()

// Items.sync({ force: true });
// ItemDetails.sync({ force: true });
// Molecule.sync({ alter: true });
// ItemBrandName.sync({ alter: true });
// ItemCategory.sync({ alter: true });
// DosageForm.sync({ alter: true });
// StrengthUnit.sync({ alter: true });
// Manufacturer.sync({ alter: true });
// UOM.sync({ alter: true });
// HSNCode.sync({ alter: true });

// sequelize.sync();
module.exports = {
  Patient,
  User,
  UserTokens,
  Clinic,
  Doctor,
  Specialization,
  Appointment,
  PatientDetails,
  Package,
  Service,
  ServiceCategory,
  Items,
  ItemDetails,
  Department,
  Employee,
  Molecule,
  ItemBrandName,
  ItemCategory,
  DosageForm,
  StrengthUnit,
  Manufacturer,
  UOM,
  HSNCode,
  Store,
  EMR,
  Source,
  Treatment,
  Counselor,
  SpouseDetails,
  SponsorInfo,
  BankDetails,

};
