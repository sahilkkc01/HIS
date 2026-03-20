const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const PreExistingCondition = sequelize.define('PreExistingCondition', {

  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  condition_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  since: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  }

}, {
  timestamps: true,
  tableName: 'pre_existing_conditions'
});
// PreExistingCondition.sync({alter: true});

const Allergy = sequelize.define('Allergy', {

  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  allergy_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  severity: {
    type: DataTypes.STRING, // low / medium / high
    allowNull: true,
  },

  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  }

}, {
  timestamps: true,
  tableName: 'allergies'
});
// Allergy.sync({alter: true});

const ChiefComplaint = sequelize.define('ChiefComplaint', {

  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  duration: {
    type: DataTypes.STRING,
  },

  severity: {
    type: DataTypes.STRING,
  },

  onset: {
    type: DataTypes.DATEONLY,
  },

  status: {
    type: DataTypes.STRING,
  },

  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
  }

}, {
  timestamps: true,
  tableName: 'chief_complaints'
});
// ChiefComplaint.sync({alter: true});

const InfertilityHistory = sequelize.define('InfertilityHistory', {

  clinic_id: { type: DataTypes.INTEGER, allowNull: false },
  patient_id: { type: DataTypes.INTEGER, allowNull: false },

  chiefComplaint: DataTypes.STRING,

  height: DataTypes.FLOAT,
  weight: DataTypes.FLOAT,
  bmi: DataTypes.FLOAT,
  pulse: DataTypes.INTEGER,

  bpSystolic: DataTypes.STRING,
  bpDiastolic: DataTypes.STRING,

  gravida: DataTypes.STRING,
  preterm: DataTypes.STRING,
  abortions: DataTypes.STRING,
  living: DataTypes.STRING,

  durationYears: DataTypes.INTEGER,
  durationMonths: DataTypes.INTEGER,

  oiTi: DataTypes.STRING,
  ivf: DataTypes.STRING,
  iui: DataTypes.STRING,

  comments: DataTypes.TEXT,

  // 🔥 NEW
  lmpDate: DataTypes.DATEONLY,
  menstrualFlow: DataTypes.STRING,
  menstrualPain: DataTypes.STRING,
  menstrualFlowType: DataTypes.STRING,

  familyHistory: DataTypes.STRING,

  obstetricHistory: DataTypes.JSON,
  investigations: DataTypes.JSON,

  partnerHistory: DataTypes.TEXT,

  recurrentPregnancyLoss: DataTypes.BOOLEAN,

  created_by: DataTypes.STRING

}, {
  timestamps: true,
  tableName: 'infertility_history'
});
// InfertilityHistory.sync({alter: true});
module.exports = { 
    PreExistingCondition,
    Allergy,
    ChiefComplaint,
    InfertilityHistory
}