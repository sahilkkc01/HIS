const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../db");

const Patient = sequelize.define('patients', {
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
        type: DataTypes.ENUM('M', 'F', 'O'),
        allowNull: false,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 120,
        },
    }
}, {
    timestamps: true,
    alter:true,
    tableName: "patients", 
});

const PatientDetails=sequelize.define('PatientDetails',{
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
    alter:true,
    tableName: "patientdetails", 
})

const Appointment = sequelize.define('Appointment', {
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
      allowNull: false
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'appointments', // Name of the table in the database
    timestamps: true // Adds createdAt and updatedAt fields
  });

const User = sequelize.define('User', {
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
        defaultValue:1,
        allowNull: false,
    },
}, {
    timestamps: true, 
    tableName: 'users', 
    alter:true
});

const Clinic = sequelize.define('Clinic', {
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
}, {
    timestamps: true, 
    alter:true,
    tableName: 'clinics', 
});

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
        type: DataTypes.ENUM('M', 'F', 'O'),
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
}, {
    timestamps: true,
    alter: true,
    tableName: "doctors",
});

const Specialization = sequelize.define('Specialization', {
    clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
  
}, {
    timestamps: true,
    alter: true,
    tableName: "specialization",
});



// sequelize.sync()
module.exports = { 
    Patient,
    User,
    UserTokens,
    Clinic,
    Doctor,
    Specialization,
    Appointment,
    PatientDetails};