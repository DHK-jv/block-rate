import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    user:    { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    content: { type: String, required: true, trim: true, minlength: 10, maxlength: 1000 },
    orderID: { type: mongoose.Schema.Types.ObjectId, ref: "Order",   required: true },
    txHash:  { type: String, default: null,sparse: true,  unique: true },
  },
  { timestamps: true }
);

reviewSchema.index({ orderID: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema, "Reviews");