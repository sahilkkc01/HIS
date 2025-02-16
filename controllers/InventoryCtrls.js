const { Items, ItemDetails } = require("../models/HisSchema");
const { GRN, Indent, StockTransaction, CurrentStock, PurchaseOrder, IssueToStore } = require("../models/InventorySchema");
const sjcl = require("sjcl");

const secretKey='his'
// Encryption function
function encryptDataForUrl(data) {
  // Encrypt data with the secret key
  const encrypted = sjcl.encrypt(secretKey, data);

  // Base64-encode the encrypted JSON string for URL safety
  return encodeURIComponent(btoa(encrypted));
}

// Decryption function
function decryptData(encodedEncryptedData) {
  try {
    // Decode the Base64-encoded data from the URL
    const encryptedData = atob(decodeURIComponent(encodedEncryptedData));

    // Decrypt using SJCL and return the result
    return sjcl.decrypt(secretKey, encryptedData);
  } catch (error) {
    console.error("Decryption error:", error.message);
    return null; // Handle or return as needed
  }
}
exports.getAllItems = async (req, res) => {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  try {
    const items = await Items.findAll({
      where: { clinic_id: clinicId },
      order: [["medicine_name", "ASC"]],
    });

    if (!items.length) {
      return res.status(404).json({ message: "No items found" });
    }

    // Encrypt item ID before sending the response
    const encryptedItems = items.map(item => ({
      ...item.toJSON(),
      encryptedId: encryptDataForUrl(item.id.toString()), // Encrypt `id`
    }));

    return res.status(200).json({ items: encryptedItems });
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ message: "Failed to fetch items" });
  }
};

exports.getItemById = async (req, res) => {
  try {
      const { id } = req.params;
      const decId = decryptData(id)
      if (!decId) return res.status(400).json({ success: false, message: "ID is required" });

      // Fetch item details
      const item = await Items.findOne({ where: { id:decId } });

      if (!item) return res.status(404).json({ success: false, message: "Item not found" });

      // Fetch item details manually without using associations
      const itemDetails = await ItemDetails.findOne({ where: { item_id: decId } });

      // Merge item and details
      const responseData = {
          ...item.toJSON(),
          details: itemDetails ? itemDetails.toJSON() : null,
      };

      res.json({ success: true, data: responseData });
  } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.createGRN = async (req, res) => {
  console.log(req.body);
  try {
    const {
      grnNo,
      grnDate,
      store,
      supplier,
      receivedBy,
      tableData,
      totalAmount,
      totalGst,
      netAmount,
      poNo, // Added PO number
    } = req.body;

    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // Check if a GRN with the same number already exists
    const existingGRN = await GRN.findOne({ where: { grnNo } });

    if (existingGRN) {
      return res.status(400).json({ message: "GRN with this number already exists" });
    }

    // Validate required fields
    if (!grnDate || !store || !supplier || !receivedBy || !tableData || tableData.length === 0 || !totalAmount || !totalGst || !netAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create GRN record without grnNo (to get the ID first)
    const newGRN = await GRN.create({
      clinic_id: clinicId,
      grnNo: null, // Temporary null, will be updated
      grnDate,
      gateEntryNo: req.body.gateEntryNo || null,
      store,
      supplier,
      payMode: req.body.payMode || null,
      invoiceDate: req.body.invoiceDate || null,
      invoiceNo: req.body.invoiceNo || null,
      poNo, // Save PO Number
      items: tableData,
      totalAmount,
      totalGst,
      otherCharges: req.body.otherCharges || 0,
      grnDiscount: req.body.grnDiscount || 0,
      netAmount,
      receivedBy,
      remark: req.body.remark || null,
      requestedBy: req.user.name,
      status: "Pending",
    });

    // Generate GRN number based on ID
    const generatedGRNNo = `GRN-${newGRN.id}`;

    // Update the record with the generated GRN number
    await newGRN.update({ grnNo: generatedGRNNo });

    // Update PO record to reflect received quantity
if (poNo) {
  const poRecord = await PurchaseOrder.findOne({
    where: { poNo, clinic_id: clinicId },
  });

  if (!poRecord) {
    return res.status(404).json({ message: "Purchase Order not found" });
  }

  let poItems = poRecord.items; // Get PO items

  tableData.forEach((receivedItem) => {
    const poItem = poItems.find((item) => item.item_name === receivedItem.item_name);

    if (poItem) {
      console.log("Before Update:", poItem);

      // Ensure orderPendingQty is properly handled
      poItem.orderPendingQty = Math.max(
        0,
        (Number(poItem.orderPendingQty) || Number(poItem.orderQty)) - Number(receivedItem.receivedQty)
      );

      console.log("After Update:", poItem);
    }
  });

  await PurchaseOrder.update(
    { items: poItems },
    { where: { poNo, clinic_id: clinicId } }
  );

  console.log("Updated PO Record:", poItems);
}


    return res.status(201).json({
      message: "GRN created successfully",
      grnNo: generatedGRNNo,
      data: newGRN,
    });
  } catch (error) {
    console.error("Error creating GRN:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.createIndent = async (req, res) => {
  console.log(req.user);
  console.log(req.body)
  try {
    const { indentNo, indentDate, fromStore, toStore, tableData, totalAmount, remark,patientName ,contactNo} = req.body;
    const clinicId = req.user?.clinic_id;

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // Check if an Indent with the same number already exists
    const existingIndent = await Indent.findOne({ where: { indentNo } });
    if (existingIndent) {
      return res.status(400).json({ message: "Indent with this number already exists" });
    }

    // Validate required fields
    if (!indentDate || !fromStore || !toStore || !tableData || tableData.length === 0 || !totalAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create Indent record without indentNo (to get the ID first)
    const newIndent = await Indent.create({
      clinic_id: clinicId,
      indentNo: null, // Temporary null, will be updated
      indentDate,
      fromStore,
      toStore,
      requestedBy:req.user.name,
      approvedBy: null,
      status: "Pending",
      items:tableData,
      totalAmount,
      remark: remark || null,
      patientName: patientName || null,
      contactNo: contactNo || null
    });

    // Generate Indent number based on ID
    const generatedIndentNo = `IND-${newIndent.id}`;

    // Update the record with the generated Indent number
    await newIndent.update({ indentNo: generatedIndentNo });

    return res.status(201).json({ message: "Indent created successfully", indentNo: generatedIndentNo, data: newIndent });
  } catch (error) {
    console.error("Error creating Indent:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.getAllGRNs = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    const grns = await GRN.findAll({
      where: { clinic_id: clinicId },
      order: [["createdAt", "DESC"]], // Latest GRNs first
    });

    return res.status(200).json({ grns });
  } catch (error) {
    console.error("Error fetching GRNs:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.getAllIndents = async (req, res) => {
  try {
    const { clinic_id } = req.user; // Retrieve clinic_id from the authenticated user

    if (!clinic_id) {
      return res.status(400).json({ message: "Clinic ID is required." });
    }

    const indents = await Indent.findAll({
      where: { clinic_id },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({ success: true, indents });
  } catch (error) {
    console.error("Error fetching indents:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.approveGrn = async (req, res) => {
  try {
    const { grnId } = req.params;
    const grn = await GRN.findByPk(grnId);

    if (!grn) {
      return res.status(404).json({ message: "GRN not found" });
    }

    if (grn.status === "Approved") {
      return res.status(400).json({ message: "GRN is already approved" });
    }

    const grnItems = grn.items; 

    for (const item of grnItems) {
      const {
        item_name,
        batchCode,
        expiryDate,
        mrp,
        costPrice,
        gst,
        gstAmount,
        receivedQty,
        freeQty,
        totalCost,
        netAmount,
      } = item;

      const totalReceived = parseFloat(receivedQty) + parseFloat(freeQty); // Free stock included
      const parsedMrp = parseFloat(mrp);
      const parsedCostPrice = parseFloat(costPrice);
      const parsedGst = parseFloat(gst) || 0;
      const parsedGstAmount = parseFloat(gstAmount) || 0;
      const parsedTotalCost = parseFloat(totalCost);
      const parsedNetAmount = parseFloat(netAmount);

      let stockItem = await CurrentStock.findOne({
        where: { itemName: item_name, batchCode, store: grn.store },
      });

      if (stockItem) {
        // Update existing stock for the batch
        await stockItem.update({
          availableStock: stockItem.availableStock + totalReceived,
          totalCost: stockItem.totalCost + parsedTotalCost,
          netAmount: stockItem.netAmount + parsedNetAmount,
          gstAmount: stockItem.gstAmount + parsedGstAmount,
          lastUpdated: new Date(),
        });
      } else {
        // Insert new stock entry
        await CurrentStock.create({
          clinic_id: grn.clinic_id,
          store: grn.store, // Added store
          itemName: item_name,
          batchCode,
          expiryDate,
          mrp: parsedMrp,
          costPrice: parsedCostPrice,
          availableStock: totalReceived,
          gst: parsedGst,
          gstAmount: parsedGstAmount,
          totalCost: parsedTotalCost,
          netAmount: parsedNetAmount,
        });
      }

      // Record stock transaction
      await StockTransaction.create({
        clinic_id: grn.clinic_id,
        store: grn.store, // Added store
        grnId,
        transactionType: "Received",
        itemName: item_name,
        batchCode,
        expiryDate,
        quantity: totalReceived,
        costPrice: parsedCostPrice,
        totalCost: parsedTotalCost,
        netAmount: parsedNetAmount,
        gstAmount: parsedGstAmount,
      });
    }

    // Update GRN status and approver
    await grn.update({ status: "Approved", approvedBy: req.user.name });

    res.json({ message: "GRN approved and stock updated successfully" });
  } catch (error) {
    console.error("Error approving GRN:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};





// Reject GRN
exports.rejectGrn = async (req, res) => {
  try {
    const { grnId } = req.params;
    const { remark } = req.body; // Assuming the rejection reason is sent in the request body

    const grn = await GRN.findByPk(grnId);
    if (!grn) {
      return res.status(404).json({ success: false, message: "GRN not found" });
    }

    if (grn.status !== "Pending") {
      return res.status(400).json({ success: false, message: `GRN is already ${grn.status}` });
    }

    await grn.update({
      status: "Rejected",
      remark, // Store the rejection reason
    });

    return res.status(200).json({ success: true, message: "GRN rejected successfully" });
  } catch (error) {
    console.error("Error rejecting GRN:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getCurrentStock = async (req, res) => {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  try {
    const stockItems = await CurrentStock.findAll({
      where: { clinic_id: clinicId },
      order: [["itemName", "ASC"]],
    });

    res.json({
      success: true,
      stock: stockItems,
    });
  } catch (error) {
    console.error("Error fetching current stock:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getStockTransaction = async (req, res) => {
  const clinicId = req.user?.clinic_id;

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  try {
    const stockTransactions = await StockTransaction.findAll({
      where: { clinic_id: clinicId },
      order: [["transactionDate", "DESC"]],
    });

    res.json({
      success: true,
      transactions: stockTransactions,
    });
  } catch (error) {
    console.error("Error fetching stock transactions:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.createPO = async (req, res) => {
  console.log(req.body);
  try {
    const {
      poNo,
      poDate,
      store,
      paymentMode,
      supplier,
      supplierId,
      expectedDeliveryDate,
      paymentTerms,
      delivery,
      deliveryDuration,
      contactNumber,
      tableData,
      totalGst,
      otherCharges,
      poDiscount,
      netAmount,
      instructions,
      remarks,
      indentNo, // Added indentNo
    } = req.body;

    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    // Check if a PO with the same number already exists
    const existingPO = await PurchaseOrder.findOne({ where: { poNo } });
    if (existingPO) {
      return res.status(400).json({ message: "PO with this number already exists" });
    }
    
    if (!tableData || tableData.length === 0) {
      return res.status(400).json({ message: "Please add at least one item" });
    }

    // Validate required fields
    if (!poDate || !store || !supplier || !netAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create PO record without poNo (to get the ID first)
    const newPO = await PurchaseOrder.create({
      clinic_id: clinicId,
      poNo: null, // Temporary null, will be updated
      indentNo, // Save indentNo
      poDate,
      store,
      paymentMode,
      supplier,
      supplierId,
      expectedDeliveryDate,
      paymentTerms,
      delivery,
      deliveryDuration,
      contactNumber,
      items: tableData,
      totalGst,
      otherCharges: otherCharges || 0,
      poDiscount: poDiscount || 0,
      netAmount,
      instructions,
      remarks,
      status: "Pending",
      createdBy: req.user.name,
    });

    // Generate PO number based on ID
    const generatedPONo = `PO-${newPO.id}`;

    // Update the record with the generated PO number
    await newPO.update({ poNo: generatedPONo });

    // If indentNo exists, update the indent record
    if (indentNo) {
      const indentRecord = await Indent.findOne({ where: { indentNo, clinic_id: clinicId } });
    
      if (!indentRecord) {
        return res.status(404).json({ message: "Indent record not found" });
      }
    
      let indentItems = indentRecord.items; // Sequelize should return this as a JSON object
    
      tableData.forEach(poItem => {
        const indentItem = indentItems.find(item => item.item_name === poItem.item_name);
    
        if (indentItem) {
          console.log("Before Update:", indentItem);
    
          indentItem.indentPendingQty = indentItem.indentPendingQty
            ? Math.max(0, indentItem.indentPendingQty - poItem.orderQty)
            : Math.max(0, indentItem.indentQty - poItem.orderQty);
    
          console.log("After Update:", indentItem);
        }
      });
    
      await Indent.update(
        { items: indentItems },
        { where: { indentNo ,clinic_id:clinicId} }
      );
    
      console.log("Updated Indent Record:", indentRecord.items);
    }
    

    return res.status(201).json({
      message: "Purchase Order created successfully",
      poNo: generatedPONo,
      data: newPO,
    });
  } catch (error) {
    console.error("Error creating Purchase Order:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.getAllPOs = async (req, res) => {
  try {
    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    const purchaseOrders = await PurchaseOrder.findAll({
      where: { clinic_id: clinicId },
      order: [["createdAt", "DESC"]], // Latest POs first
    });

    return res.status(200).json({ purchaseOrders });
  } catch (error) {
    console.error("Error fetching Purchase Orders:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Approve PO
exports.approvePo = async (req, res) => {
  try {
    const { poId } = req.params;
    const po = await PurchaseOrder.findByPk(poId);

    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    
    if (po.status !== "Pending") {
      return res.status(400).json({ success: false, message: `PO is already ${po.status}` });
    }

    await po.update({ status: "Approved",approvedBy:req.user.name });

    res.json({ message: "Purchase Order approved successfully" });
  } catch (error) {
    console.error("Error approving PO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reject PO
exports.rejectPo = async (req, res) => {
  try {
    const { poId } = req.params;
    const po = await PurchaseOrder.findByPk(poId);

    if (!po) {
      return res.status(404).json({ message: "Purchase Order not found" });
    }

    if (po.status !== "Pending") {
      return res.status(400).json({ success: false, message: `PO is already ${po.status}` });
    }

    await po.update({ status: "Rejected" });

    res.json({ message: "Purchase Order rejected successfully" });
  } catch (error) {
    console.error("Error rejecting PO:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getIndentsByStore = async (req, res) => {
  try {
    const { store } = req.params;
    const clinic_id = req.user.clinic_id;

    if (!store) {
      return res.status(400).json({ message: "Store name is required." });
    }

    if (!clinic_id) {
      return res.status(403).json({ message: "Unauthorized. Clinic ID is missing." });
    }

    // Fetch indents for the given store and clinic
    const indents = await Indent.findAll({
      where: {
        toStore: store,
        clinic_id: clinic_id,
        status: "Approved",
      },
      order: [["createdAt", "DESC"]],
      raw: true, // Ensures plain JSON output
    });

    // Fetch stock details for the given store and clinic
    const stockItems = await CurrentStock.findAll({
      where: {
        store: store,
        clinic_id: clinic_id,
      },
      attributes: ["itemName", "batchCode", "expiryDate", "availableStock", "mrp", "costPrice", "gst"],
      raw: true,
    });

    console.log(stockItems);

    // Attach stock details within each indent's item field
    const indentsWithStock = indents.map(indent => {
      return {
        ...indent,
        items: indent.items.map(item => {
          const stockItem = stockItems.find(stock => stock.itemName === item.item_name);
          return {
            ...item,
            stockDetails: stockItem || null, // Add stock details if available, else null
          };
        }),
      };
    });

    console.log(indentsWithStock);

    return res.json({ success: true, indents: indentsWithStock });
  } catch (error) {
    console.error("Error fetching indents with stock details:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


// Approve Indent
exports.approveIndent = async (req, res) => {
  try {
    const { indentId } = req.params;
    const indent = await Indent.findByPk(indentId);

    if (!indent) {
      return res.status(404).json({ message: "Indent not found" });
    }

    if (indent.status !== "Pending") {
      return res.status(400).json({ success: false, message: `Indent is already ${indent.status}` });
    }

    await indent.update({ status: "Approved" ,approvedBy:req.user.name});

    res.json({ message: "Indent approved successfully" });
  } catch (error) {
    console.error("Error approving Indent:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reject Indent
exports.rejectIndent = async (req, res) => {
  try {
    const { indentId } = req.params;
    const indent = await Indent.findByPk(indentId);

    if (!indent) {
      return res.status(404).json({ message: "Indent not found" });
    }

    if (indent.status !== "Pending") {
      return res.status(400).json({ success: false, message: `Indent is already ${indent.status}` });
    }

    await indent.update({ status: "Rejected" });

    res.json({ message: "Indent rejected successfully" });
  } catch (error) {
    console.error("Error rejecting Indent:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getPOsByStore = async (req, res) => {
  try {
    const { store } = req.params;
    const clinic_id = req.user.clinic_id; // Get clinic ID from the logged-in user

    if (!store) {
      return res.status(400).json({ message: "Store name is required." });
    }

    if (!clinic_id) {
      return res.status(403).json({ message: "Unauthorized. Clinic ID is missing." });
    }

    // Fetch POs for the given store and clinic
    const purchaseOrders = await PurchaseOrder.findAll({
      where: {
        store: store,
        clinic_id: clinic_id, // Ensure only POs for the correct clinic are retrieved
        status:"Approved"
      },
      order: [["createdAt", "DESC"]],
    });

    return res.json({ success: true, purchaseOrders });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};


exports.createIssue = async (req, res) => {
  console.log(req.body);
  try {
    const {
      issueNo,
      issueDate,
      fromStore,
      toStore,
      indentNo,
      netAmount,
      remark,
      tableData, // Contains issued items
    } = req.body;

    const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

    if (!clinicId) {
      return res.status(401).json({ message: "Unauthorized: Please log in" });
    }

    if (!indentNo) {
      return res.status(400).json({ message: "Indent Number is required" });
    }

    if (!tableData || tableData.length === 0) {
      return res.status(400).json({ message: "Please add at least one item" });
    }

    if (!issueDate || !fromStore || !toStore || !netAmount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if an issue with the same number exists
    const existingIssue = await IssueToStore.findOne({ where: { issueNo } });
    if (existingIssue) {
      return res.status(400).json({ message: "Issue with this number already exists" });
    }

    // Fetch the Indent record
    const indentRecord = await Indent.findOne({ where: { indentNo, clinic_id: clinicId } });

    if (!indentRecord) {
      return res.status(404).json({ message: "Indent record not found" });
    }

    let indentItems = indentRecord.items; // Sequelize should return JSON

    // Ensure Issue Quantity does not exceed Indent Pending Quantity or Available Quantity
    tableData.forEach(issueItem => {
      const indentItem = indentItems.find(item => item.item_name === issueItem.item_name);

      if (!indentItem) {
        return res.status(400).json({ message: `Item ${issueItem.item_name} not found in Indent` });
      }

      // Initialize indentPendingQty if missing
      if (indentItem.indentPendingQty === undefined) {
        indentItem.indentPendingQty = indentItem.indentQty;
      }

      if (issueItem.isseuQty > indentItem.indentPendingQty) {
        return res.status(400).json({ message: `Issue Quantity for ${issueItem.item_name} cannot exceed Indent Pending Quantity` });
      }

      if (issueItem.isseuQty > indentItem.availableQty) {
        return res.status(400).json({ message: `Issue Quantity for ${issueItem.item_name} cannot exceed Available Quantity` });
      }

      console.log("Before Update:", indentItem);

      // Reduce indentPendingQty
      indentItem.indentPendingQty = Math.max(0, indentItem.indentPendingQty - issueItem.isseuQty);

      console.log("After Update:", indentItem);
    });

    // Update Indent record with new pending quantities
    await Indent.update(
      { items: indentItems },
      { where: { indentNo, clinic_id: clinicId } }
    );

    console.log("Updated Indent Record:", indentRecord.items);

    // Create Issue record
    const newIssue = await Issue.create({
      clinic_id: clinicId,
      issueNo,
      issueDate,
      fromStore,
      toStore,
      indentNo,
      items: tableData, // Store items as JSON
      netAmount,
      remark,
      issuedBy: req.user.name,
    });

    return res.status(201).json({
      message: "Issue created successfully",
      data: newIssue,
    });
  } catch (error) {
    console.error("Error creating Issue:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
