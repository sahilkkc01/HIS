const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../db");

const Patient = sequelize.define('patients', {
    clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
        },
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
        allowNull: true,
        validate: {
            isEmail: true,
        },
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

// sequelize.sync()
module.exports = { Patient,User,UserTokens,Clinic};