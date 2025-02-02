const { Items } = require("../models/HisSchema");

exports.getAllItems = async (req, res) => {
  const clinicId = req.user?.clinic_id; // Get clinic ID from logged-in user

  if (!clinicId) {
    return res.status(401).json({ message: "Unauthorized: Please log in" });
  }

  try {
    // Fetch all items for the clinic
    const items = await Items.findAll({
      where: { clinic_id: clinicId },
      order: [["medicine_name", "ASC"]], // Optional: Sort by medicine name
    });

    if (!items.length) {
      return res.status(404).json({ message: "No items found" });
    }

    return res.status(200).json({ items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return res.status(500).json({ message: "Failed to fetch items" });
  }
};
