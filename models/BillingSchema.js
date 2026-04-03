const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../db");

    const Bill = sequelize.define("Bill", {
        clinic_id: {
            type: DataTypes.INTEGER,
            allowNull: true 
        },
        patientId: {
            type: DataTypes.INTEGER,
            allowNull: true 
        },
        patientName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        patientGender: {
            type: DataTypes.STRING, 
            allowNull: true
        },
        patientAge: {
            type: DataTypes.STRING,
            allowNull: true
        },
        patientMobile: {
            type: DataTypes.STRING(15),
            allowNull: true // Mobile may be optional
        },
        items: {
            type: DataTypes.JSON,
            allowNull: false
        },
        discountCategory: {
            type: DataTypes.STRING(1), 
            allowNull: true 
        },
        discountValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue:0.00
        },
        discountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true ,
            defaultValue:0.00
        },
        taxAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue:0.00
        },
        netAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        remark: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        modeOfPayment: {
            type: DataTypes.STRING,
            allowNull: false
        },
        doctor: {
            type: DataTypes.STRING,
            allowNull: true
        },
         created_by: {
    type: DataTypes.STRING,
    allowNull: false
  },
    }, {
        tableName: "bills",
        timestamps: true
    });

    const AdvanceTransaction = sequelize.define("AdvanceTransaction", {
  clinic_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  billId: {
    type: DataTypes.INTEGER,
    allowNull: true 
  },

  type: {
    type: DataTypes.ENUM("CREDIT", "DEBIT"),
    allowNull: false
  },

  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  balanceAfter: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  modeOfPayment: {
    type: DataTypes.STRING,
    allowNull: true
  },

  remark: {
    type: DataTypes.TEXT,
    allowNull: true
  },
   created_by: {
    type: DataTypes.STRING,
    allowNull: false
  },
}, {
  tableName: "advance_transactions",
  timestamps: true
});
// AdvanceTransaction.sync({force:true})
module.exports={
    Bill,
    AdvanceTransaction
}
