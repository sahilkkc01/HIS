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
        doctor: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: "bills",
        timestamps: true
    });

module.exports={Bill}
