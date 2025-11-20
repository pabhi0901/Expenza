import express from "express"
const app = express()
import passport from './config/passport.config.js'
import cookieParser from "cookie-parser"
import cors from "cors"


// Routes
import authRoutes from './routes/auth.route.js'
import expenseRoute from "./routes/expense.route.js"
import budgetRoute from "./routes/budget.route.js"

app.use(passport.initialize());
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin:"http://localhost:5173",
    credentials: true
}))

app.use('/auth', authRoutes);
app.use('/expense',expenseRoute)    
app.use('/budget',budgetRoute)



export default app