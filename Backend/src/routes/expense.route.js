import express from "express"
import authMiddleware from "../middlewares/auth.middleware.js"
import { validateCreateExpense, validateUpdateExpense } from "../middlewares/expense.validator.js"
import expenseController from "../controller/expense.controller.js"
const router = express.Router()
import multer from "multer"

const upload = multer({storage:multer.memoryStorage()})


//to add the expense manually
router.post("/addManually",
    validateCreateExpense,
    authMiddleware,
    expenseController.createExpenseController
)
//to update an expense (of any type)
router.patch("/update",
    validateUpdateExpense,
    authMiddleware,
    expenseController.updateExpenseController
)

router.delete("/delete",
    authMiddleware,
    expenseController.deleteExpenseController
)

router.post("/addByImage",authMiddleware,upload.single('image'),expenseController.createExpenseByImage)

router.get("/",authMiddleware,expenseController.getAllExpense)

router.post("/ecommerce",authMiddleware,expenseController.getEcommerceBills)

export default router