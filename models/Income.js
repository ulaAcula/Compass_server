import mongoose from "mongoose";

const IncomeModel = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
    },
    yourAccount: {
      type: String,
    },

    Type: {
      type: Boolean,
    },

    memo: {
      type: String,
    },
    list: {
      type: String,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Income", IncomeModel);
