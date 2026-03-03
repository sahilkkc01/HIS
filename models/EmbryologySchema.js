const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

/**
 * Embryology Consent Model
 * Purpose: Manage patient consent records for embryology department
 * Relationships: Links to patients table for patient information
 */

const EmbryologyConsent = sequelize.define(
  "embryology_consents",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    uhid: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    consent_type: {
      type: DataTypes.ENUM(
        "IVF_CONSENT",
        "ICSI_CONSENT", 
        "EMBRYO_FREEZING",
        "SPERM_FREEZING",
        "EGG_FREEZING",
        "BLASTOCYST_TRANSFER",
        "SURROGACY"
      ),
      allowNull: false,
    },
    consent_status: {
      type: DataTypes.ENUM("PENDING", "SIGNED", "WITNESSED", "VERIFIED"),
      defaultValue: "PENDING",
    },
    consent_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    partner_consent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    witness_name: {
      type: DataTypes.STRING,
    },
    witness_signature: {
      type: DataTypes.TEXT,
    },
    doctor_name: {
      type: DataTypes.STRING,
    },
    doctor_signature: {
      type: DataTypes.TEXT,
    },
    barcode: {
      type: DataTypes.STRING,
      unique: true,
    },
    special_notes: {
      type: DataTypes.TEXT,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "embryology_consents",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

/**
 * Embryology Cycle Model
 * Purpose: Track treatment cycles for patients
 */
const EmbryologyCycle = sequelize.define(
  "embryology_cycles",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    patient_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "patients",
        key: "id",
      },
    },
    cycle_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cycle_type: {
      type: DataTypes.ENUM("IVF", "ICSI", "IUI", "FET"),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM("ONGOING", "COMPLETED", "CANCELLED", "SUSPENDED"),
      defaultValue: "ONGOING",
    },
    outcome: {
      type: DataTypes.ENUM("PREGNANT", "NOT_PREGNANT", "ONGOING"),
      defaultValue: "ONGOING",
    },
    doctor_id: {
      type: DataTypes.INTEGER,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "embryology_cycles",
    timestamps: true,
  }
);

// Define associations
EmbryologyConsent.belongsTo(EmbryologyCycle, { foreignKey: 'cycle_id', as: 'cycle' });
EmbryologyCycle.hasMany(EmbryologyConsent, { foreignKey: 'cycle_id', as: 'consents' });

module.exports = {
  EmbryologyConsent,
  EmbryologyCycle,
};
