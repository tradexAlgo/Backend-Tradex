import mongoose from "mongoose";
import hashPassword from "../middleware/hashPassword.js";
import adminModels from "../models/admin.models.js";

const createSuperAdmin = async () => {
  const email = "superadmin@example.com";
  const password = "superadmin123"; // Change this to a secure password

  try {
    // Connect to the database
    await mongoose.connect(
      "mongodb+srv://alokmani9700:PmVEsJeG2Z3EY39X@cluster0.slz3e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
      { useNewUrlParser: true, useUnifiedTopology: true }
    );

    // Check if super admin already exists
    const existingAdmin = await adminModels.findOne({ email });
    if (existingAdmin) {
      console.log("Super admin already exists.");
      return;
    }

    // Encrypt password
    const encryptedPassword = await hashPassword.encrypt(password);

    // Create super admin
    const newAdmin = new adminModels({
      email,
      fullName: "Super Admin",
      password: encryptedPassword,
      role: "SUPER_ADMIN",
    });

    await newAdmin.save();
    console.log("Super admin created successfully.");

    // Close the database connection
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error creating super admin:", error);
  }
};

// Execute the script
createSuperAdmin();
