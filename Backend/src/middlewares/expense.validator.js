import { body, param, validationResult } from "express-validator";

// Validation middleware to check for errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validator for creating a new expense
export const validateCreateExpense = [

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),

  body("category")
    .optional()
    .isString()
    .withMessage("Category must be a string")
    .isIn([
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
    ])
    .withMessage("Invalid category"),

  body("paymentMethod")
    .optional()
    .isString()
    .withMessage("Payment method must be a string")
    .isIn(["Cash", "UPI", "Card", "Other"])
    .withMessage("Invalid payment method"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in valid ISO 8601 format"),

  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .isLength({ max: 500 })
    .withMessage("Note must not exceed 500 characters"),

  body("billImageURL")
    .optional()
    .isString()
    .withMessage("Bill image URL must be a string")
    .isURL()
    .withMessage("Bill image URL must be a valid URL"),

  body("vendorName")
    .optional()
    .isString()
    .withMessage("Vendor name must be a string")
    .isLength({ max: 100 })
    .withMessage("Vendor name must not exceed 100 characters"),

  body("items")
    .optional()
    .isArray()
    .withMessage("Items must be an array"),

  body("items.*.name")
    .optional()
    .isString()
    .withMessage("Item name must be a string"),

  body("items.*.quantity")
    .optional()
    .isNumeric()
    .withMessage("Item quantity must be a number")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),

  body("items.*.price")
    .optional()
    .isNumeric()
    .withMessage("Item price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Item price must be non-negative"),

  body("items.*.total")
    .optional()
    .isNumeric()
    .withMessage("Item total must be a number")
    .isFloat({ min: 0 })
    .withMessage("Item total must be non-negative"),

  handleValidationErrors,
];

// Validator for updating an expense
export const validateUpdateExpense = [
  // param("expenseId")
  //   .isMongoId()
  //   .withMessage("Invalid expense ID format"),

  body("userId")
    .optional()
    .isMongoId()
    .withMessage("Invalid user ID format"),

  body("amount")
    .optional()
    .isNumeric()
    .withMessage("Amount must be a number")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),

  body("category")
    .optional()
    .isString()
    .withMessage("Category must be a string")
    .isIn([
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
    ])
    .withMessage("Invalid category"),

  body("paymentMethod")
    .optional()
    .isString()
    .withMessage("Payment method must be a string")
    .isIn(["Cash", "UPI", "Card", "Other"])
    .withMessage("Invalid payment method"),

  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be in valid ISO 8601 format"),

  body("note")
    .optional()
    .isString()
    .withMessage("Note must be a string")
    .isLength({ max: 500 })
    .withMessage("Note must not exceed 500 characters"),

  body("billImageURL")
    .optional()
    .isString()
    .withMessage("Bill image URL must be a string")
    .isURL()
    .withMessage("Bill image URL must be a valid URL"),

  body("vendorName")
    .optional()
    .isString()
    .withMessage("Vendor name must be a string")
    .isLength({ max: 100 })
    .withMessage("Vendor name must not exceed 100 characters"),

  body("items")
    .optional()
    .isArray()
    .withMessage("Items must be an array"),

  body("items.*.name")
    .optional()
    .isString()
    .withMessage("Item name must be a string"),

  body("items.*.quantity")
    .optional()
    .isNumeric()
    .withMessage("Item quantity must be a number")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),

  body("items.*.price")
    .optional()
    .isNumeric()
    .withMessage("Item price must be a number")
    .isFloat({ min: 0 })
    .withMessage("Item price must be non-negative"),

  body("items.*.total")
    .optional()
    .isNumeric()
    .withMessage("Item total must be a number")
    .isFloat({ min: 0 })
    .withMessage("Item total must be non-negative"),

  handleValidationErrors,
];

