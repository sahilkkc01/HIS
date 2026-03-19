const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");


const Lead = sequelize.define("Lead", {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  lead_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  female_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  female_age: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  male_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  male_age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  primary_mobile: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  secondary_mobile: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
 clinic: {
    type: DataTypes.STRING,
    allowNull: true
  },
  marriageDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  marriage_duration: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: { years: 0, months: 0, days: 0 }
  },

  past_treatments: {
    type: DataTypes.TEXT,    // or DataTypes.JSON if your DB supports it
    allowNull: true
  },
  source_primary: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source_secondary: {
    type: DataTypes.STRING,
    allowNull: true
  },
  country: {
    type: DataTypes.STRING,
    allowNull: false
  },
  state: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pin_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  full_address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  agent: {
    type: DataTypes.STRING,
    allowNull: false
  },
  admin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "Active"
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "leads",
  timestamps: true   
});
// Lead.sync({ alter: true }) 
const LeadFollowUp = sequelize.define('LeadFollowUp', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  call_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  priority: {
    type: DataTypes.ENUM('cold', 'warm', 'hot'),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('followup', 'not-qualified', 'appointment'),
    allowNull: false,
  },
  followup_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'lead_followups',
});

const LeadAppointment = sequelize.define('LeadAppointment', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  appointment_clinic: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  appointment_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  apptTimeSlot: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  appointment_doctor_id: {
    type: DataTypes.INTEGER,
     allowNull: false,
  },
  appointment_doctor: {
    type: DataTypes.STRING,
     allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Scheduled'
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'lead_appointments',
});

const LeadVisited = sequelize.define('LeadVisited', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  visit_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  uhid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  doctor_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  doctor_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  consultant_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  consultant_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'lead_visiteds', // follows your plural camelCase style
});

const VisitFollowup = sequelize.define('VisitFollowup', {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    visit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    call_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('cold', 'warm', 'hot'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('followup', 'converted'),
      allowNull: false,
    },
    followup_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    timestamps: true,
    tableName: 'visit_followups' // adjust if you prefer a different naming convention
  });

const LeadConverted = sequelize.define('LeadConverted', {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  procedures: {
    type: DataTypes.TEXT,
    allowNull: false,
    // store multiple selections as comma-separated values or JSON string
  },
  package_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  package_offered: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  discount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00,
  },
  counselor_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  booking_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'partial'),
    allowNull: false,
    defaultValue: 'pending',
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  timestamps: true,
  tableName: 'leadconverteds', // plural camelCase style
});

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

const Agent = sequelize.define('Agent', {
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
  tableName: 'agents',
});



  // Source.sync()
  // Treatment.sync()
// Counselor.sync()
// Agent.sync()
// Clinic.sync({force:true})
// Doctor.sync()
// LeadConverted.sync()
// VisitFollowup.sync()
// LeadVisited.sync()
// LeadFollowUp.sync()
// Lead.sync({force:true})
// LeadAppointment.sync({force:true})


module.exports = { 
LeadFollowUp,
Lead,
LeadAppointment,
LeadVisited,
VisitFollowup,
LeadConverted,
Doctor,
Agent,
// Counselor,
// Treatment,
};
