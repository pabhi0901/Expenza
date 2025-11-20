import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },  

  // Total monthly budget set by user
  amount: {
    type: Number,
    required: true
  },

  // How much user has spent in this month
  spent: {
    type: Number,
    default: 0
  },

  // Threshold flags for notifications
  flags: {
    sixty: {
      type: Boolean,
      default: false
    },
    eighty: {
      type: Boolean,
      default: false
    },
    hundred: {
      type: Boolean,
      default: false
    }
  },

  // For lazy reset
  lastResetMonth: {
    type: Number,   // 1–12
    required: true
  },
  lastResetYear: {
    type: Number,
    required: true
  },
  


}, { timestamps: true });

export default mongoose.model("Budget", budgetSchema);
