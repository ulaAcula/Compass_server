import mongoose from "mongoose";

const AccountModel = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    unchangingBalance: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Account", AccountModel);
