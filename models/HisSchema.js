const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../db");

const Patient = sequelize.define(
  "patients",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    uhid: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    patientImage: {
      type: DataTypes.STRING,
    },
    mobile: {
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
    gender: {
      type: DataTypes.ENUM("M", "F", "O"),
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 120,
      },
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "patients",
  }
);

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
  },
  {
    timestamps: true,
    tableName: "users",
    alter: true,
  }
);

const Clinic = sequelize.define(
  "Clinic",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contact_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reg_no: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    OperatingDetails: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true, // Optional
    },
    header_image: {
      type: DataTypes.STRING,
      allowNull: true, // Optional
    },
    footer_image: {
      type: DataTypes.STRING,
      allowNull: true, // Optional
    },
    ipd_service: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    no_of_beds: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    emergency_services: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    ambulance_service: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    TPA: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "clinics",
  }
);

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

const Doctor = sequelize.define(
  "Doctors",
  {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    doctorImage: {
      type: DataTypes.STRING,
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
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("M", "F", "O"),
      allowNull: false,
    },
    practicingSince: {
      type: DataTypes.STRING,
    },
    qualification: {
      type: DataTypes.STRING,
    },
    specialization: {
      type: DataTypes.STRING,
    },
    regNo: {
      type: DataTypes.STRING,
    },
    consultationFees: {
      type: DataTypes.DECIMAL(10, 2),
    },
    ipd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    opd: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    otherDetails: {
      type: DataTypes.TEXT,
    },
    appointmentCalendar: {
      type: DataTypes.JSON,
    },
    timeslot: {
      type: DataTypes.INTEGER,
    },
  },
  {
    timestamps: true,
    alter: true,
    tableName: "doctors",
  }
);

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
};
