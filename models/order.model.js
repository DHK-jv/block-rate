import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    price:     { type: Number, required: true },
    status:        { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
    reviewStatus:  { type: String, enum: ["pending", "reviewed"],                default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema, "Orders");
