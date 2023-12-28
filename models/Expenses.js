import mongoose from "mongoose";

const ExpensesModel = new mongoose.Schema(
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

    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
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

export default mongoose.model("Expenses", ExpensesModel);
