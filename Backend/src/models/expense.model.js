import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  category: {
    type: String,
    enum:[
  "foodAndDrinks",
  "groceries",
  "transport",
  "shopping",
  "billsAndUtilities",
  "entertainment",
  "healthAndFitness",
  "education",
  "subscriptions",
  "rent",
  "personalCare",
  "other",
  "fuel",
  "giftsAndDonations",
  "emiLoans",
  "insurance",
  "savingsInvestments",
  "householdItems",
  "kidsFamily",
  "eventsParties",
],
default:"other"

  },

  paymentMethod: {
    type: String,
    enum: ["Cash", "UPI", "Card", "Other"],
    default: "Other"
  },

  date: {
    type: Date,
    default: Date.now
  },

  note: {
    type: String
  },

  billImageURL: { 
    type: String
  },

  vendorName: {
    type: String
  },

  items: [
    {
      name: String,
      quantity: Number,       // optional
      price: Number,          // optional (each price)
    }
  ]

}, { timestamps: true });


const expenseModel = mongoose.model("expense",expenseSchema)

export default expenseModel