import express from "express"
import budgetController from "../controller/budget.controller.js"
import authMiddleware from '../middlewares/auth.middleware.js';
const router = express.Router()


router.post("/setbudget",authMiddleware,budgetController.setBudget)
router.post("/updatebudget",authMiddleware,budgetController.updateBudget)
router.get("/",authMiddleware,budgetController.getBudget)


export default router