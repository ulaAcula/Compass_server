import mongoose from "mongoose";

const PlanModel = new mongoose.Schema(
  {
    plan: {
      type: Array,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Plan", PlanModel);
