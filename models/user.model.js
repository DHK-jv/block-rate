import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String, required: true, unique: true, lowercase: true, trim: true,
    },
    role:   { type: String, enum: ["user", "admin"], default: "user" },
    purchasedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema, "Users");