const { DataTypes, Sequelize } = require("sequelize");
const { sequelize } = require("../db");

const GRN = sequelize.define(
    "GRN",
    {
      clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      grnNo: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      poNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      grnDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      gateEntryNo: {
        type: DataTypes.STRING,
        
      },
      store: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payMode: {
        type: DataTypes.ENUM("GRC", "Credit"),
        
      },
      invoiceDate: {
        type: DataTypes.DATEONLY,
       
      },
      invoiceNo: {
        type: DataTypes.STRING,
        
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
       
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      totalGst: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      otherCharges: {
        type: DataTypes.FLOAT,
        
        defaultValue: 0,
      },
      grnDiscount: {
        type: DataTypes.FLOAT,
       
        defaultValue: 0,
      },
      netAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      receivedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requestedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      approvedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
    },
    {
      timestamps: true,
      alter: true,
      tableName: "grns",
    }
  );
  
  const Indent = sequelize.define(
    "Indent",
    {
      clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      indentNo: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      indentDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      fromStore: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      toStore: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      requestedBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      approvedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
        defaultValue: "Pending",
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      totalAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      patientName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      alter: true,
      tableName: "indents",
    }
  );
  
  const CurrentStock = sequelize.define("CurrentStock", {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    store: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    batchCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    mrp: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    costPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    gst: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    gstAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    availableStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalCost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    netAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
  
    },
  }, {
    timestamps: true,
    tableName: "currentstocks",
  });

  const StockTransaction = sequelize.define("StockTransaction", {
    clinic_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    store: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grnId: {
      type: DataTypes.INTEGER,
      allowNull: true,
     
    },
    transactionType: {
      type: DataTypes.ENUM("Received", "Issued"),
      allowNull: false,
      
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    batchCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      
    },
    costPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    totalCost: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    netAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    timestamps: true,
    tableName: "stocktransactions",
  });

  const PurchaseOrder = sequelize.define(
    "PurchaseOrder",
    {
      clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      poNo: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      indentNo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      poDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      store: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paymentMode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      supplier: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      supplierId: {
        type: DataTypes.INTEGER,
       
      },
      expectedDeliveryDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      paymentTerms: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      delivery: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      deliveryDuration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      items: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      totalGst: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      otherCharges: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      poDiscount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
      },
      netAmount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("Pending", "Approved", "Rejected", "Completed"),
        allowNull: false,
        defaultValue: "Pending",
      },
      createdBy: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      approvedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
      tableName: "purchaseorders",
    }
  );

const IssueToStore = sequelize.define("IssueToStore", {
    clinic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    issueNo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    issueDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    fromStore: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    toStore: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    indentNo: {
        type: DataTypes.STRING,
        allowNull: false, 
    },
    items: {
        type: DataTypes.JSON, // Store items as a JSON array
        allowNull: false,
    },
    netAmount: {
        type: DataTypes.DECIMAL(10, 2), // Stores up to 99999999.99
        allowNull: false,
        defaultValue: 0.00,
    },
    remark: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    issuedBy: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    tableName: "issuetostore", 
    timestamps: true, 
});
IssueToStore.sync()
  module.exports={
    GRN,
    Indent,
    CurrentStock,
    StockTransaction,
    PurchaseOrder,
    IssueToStore
  }