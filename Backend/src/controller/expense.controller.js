import expenseModel from "../models/expense.model.js"
import budgetModel from "../models/budget.model.js"
import imageConvertFunction from "../services/tesseract.service.js";
import createBillfromText from "../services/ai.service.js";


const checkMonthChange = (budget)=>{
    const now = new Date()
    const month = now.getMonth() + 1; // 0–11 hota hai month
    const year = now.getFullYear();

    if(month!=budget.lastResetMonth || year!=budget.lastResetYear)
    {
        budget.lastResetMonth = month
        budget.lastResetYear = year
        budget.spent = 0
        
        for(let key in budget.flags){
             budget.flags[key] = false
        }
    }

    return budget
}

const checkBudgetLimit = (budget)=>{    
    const spent = budget.spent
    const amount = budget.amount
    const percentUsed = Math.floor((spent/amount)*100)
   
    
    //flags are been used for checking wheather the notification has been sended earlier for this percent or not 
    
    //eg:- here check if budget is >=100 then  mark all flags true (means for 60,80,100 the flags only one 100% will be sended and return true and percentUsed, that true in return will be used in frontend for deciding wheather we have to show the notification to user or not and percentUsed will be used in the progressBar 


    if(percentUsed>=100 && budget.flags.hundred==false)
    {
        budget.flags.hundred=true
        budget.flags.eighty=true
        budget.flags.sixty = true
        return [true,percentUsed,budget]
    }
    
    else if(percentUsed>=80 && budget.flags.eighty==false)
    {
        budget.flags.eighty=true
        budget.flags.sixty = true
        return [true,percentUsed,budget]
    }
    
    else if(percentUsed>=60 && budget.flags.sixty==false)
    {
        budget.flags.sixty = true
        return [true,percentUsed,budget]

    }
    else 
    {
        return [false,percentUsed,budget]
    }

}

//after we descrease amount in spended budget we check for flags and remark them accordingly
const remarkBudgetFlags = (budget)=>{
    const {amount,spent} = budget
    const spendPercent = Math.floor((spent/amount)*100)
    
    if(spendPercent>=100 && budget.flags.hundred == true)
    {
        budget.flags.hundred = false
    }
    else if(spendPercent>=80 && budget.flags.eighty==true)
    {
        budget.flags.hundred = false
        budget.flags.eighty = false
    }
    // else if(spendPercent>=60 && budget.flags.sixty==true){
    //     budget.flags.hundred = false
    //     budget.flags.eighty = false
    //     budget.flags.sixty = false
    // }   
    else
    {
        budget.flags.hundred = false
        budget.flags.eighty = false
        budget.flags.sixty = false
    }

    return budget

}

const createExpenseController = async(req,res)=>{

    const {amount,category='others',paymentMethod='Other',vendorName=null,items=[],note=""} = req.body
    const {userId} = req.user

    //creating an expense
    const expense = await expenseModel.create({
        userId,amount,category,paymentMethod,vendorName,items,note
    })

    //finding the user budget 
    let budget = await budgetModel.findOne({userId})

    //checking for month change, if yes then reset the budget and update the month year
    budget = checkMonthChange(budget)


 

    //calculating total spent
    const totalSpent = Number(amount) + budget.spent


    //updating the total money spent in the user budget schema
    budget.spent = totalSpent


    const budgetReport = checkBudgetLimit(budget)

    budget = budgetReport[2]
    await budget.save()

    res.status(201).json({
        "mess":"Expense added succesfully",
        expenseId:expense._id,
        amount:expense.amount,
        category:expense.category,
        paymentMethod:expense.paymentMethod,
        vendorName:expense.vendorName,
        items:expense.items,
        note:expense.note,
        notificationAlert:budgetReport[0],
        percentUsed:budgetReport[1]
    })


}

const updateExpenseController = async(req,res)=>{

try{
    
    const {expenseId,amount,category,paymentMethod,vendorName,items=[],note=""} = req.body
    const {userId} = req.user

    const expense = await expenseModel.findById(expenseId)
    let budget =  await budgetModel.findOne({userId})
    
    if(!expense || !budget){
        return res.status(404).json({
            "mess":"Some error occoured"
        })
    }

     budget = checkMonthChange(budget)

    let expenseDate = expense.date
    let expenseMonth = expenseDate.getMonth()+1
    let expenseYear = expenseDate.getFullYear()

   
    if(budget.lastResetYear==expenseYear && budget.lastResetMonth == expenseMonth ) 
    { 
    
    budget.spent-= Number(expense.amount)
    budget = remarkBudgetFlags(budget)

    

    budget.spent+=Number(amount)
    
    let budgetReport = checkBudgetLimit(budget)
    
    budget = budgetReport[2]

    if(amount!=undefined) expense.amount = amount
    if(category) expense.category = category
    if(paymentMethod) expense.paymentMethod = paymentMethod
    if(vendorName) expense.vendorName = vendorName
    if(note) expense.note = note
    if(items.length>0) expense.items = items

    await budget.save()
    await expense.save()

      res.status(201).json({
        "mess":"Expense updated succesfully",
        expenseId:expense._id,
        amount:expense.amount,
        category:expense.category,
        paymentMethod:expense.paymentMethod,
        vendorName:expense.vendorName,
        items:expense.items,
        note:expense.note,
        notificationAlert:budgetReport[0],
        percentUsed:budgetReport[1]
    })

}
//month of expense and updating month are different so cannot update it.
else{
       return res.status(403).json({
            "mess":"Cannot update this expense"
        })
}

}catch(err){
    console.log("Error updating the expense");
    
   } 
   
}

const deleteExpenseController = async(req,res)=>{
    const {expenseId} = req.body
    const {userId} = req.user

    const expense = await expenseModel.findOne({
        _id:expenseId,
        userId
    })
    
    if(!expense){
        return res.status(404).json({
            "mess":"You can only delete your own expense"
        })
    }
    
    let budget = await budgetModel.findOne({userId})

    if(!budget){
        return res.status(404).json({
            "mess":"Some error occoured while deleting the expense"
        })
    }

    budget = checkMonthChange(budget)

    let expenseDate = expense.date
    let expenseMonth = expenseDate.getMonth()+1
    let expenseYear = expenseDate.getFullYear()

   
    if(budget.lastResetYear==expenseYear && budget.lastResetMonth == expenseMonth ) 
    { 
            budget.spent-=Number(expense.amount)
            budget = remarkBudgetFlags(budget)

            await budget.save()
            await expenseModel.deleteOne({
                userId,
                _id:expenseId
            })

            await budget.save()

            res.status(200).json({
                "mess":"Expense deleted succesfully"
            })

    }
    else
    {
        res.status(400).json({
            "mess":"You can delete the expense in same month only"
        })
    }

    
   
}

const createExpenseByImage = async(req,res)=>{
    const image = req.file
    const {userId} = req.user
    
    let budget = await budgetModel.findOne({userId})

    if(!budget){
        return res.status(404).json({
            "mess":"Some error occoured while creating expense"
        })
    }

    budget = checkMonthChange(budget)


    let billText 
    try
    {    
       billText = await imageConvertFunction(image.buffer)
    }
    catch(err)
    {
        console.log("Error in generating ocr text ," ,err);
        
    }

    let jsonBill 

    try{
         jsonBill = await createBillfromText(billText)
    }
    catch(err){
        console.log("Error in generating bill from text ," ,err);
    }

    console.log(jsonBill);
    const {amount,category,vendorName,paymentMethod} = jsonBill
    
    const expense = await expenseModel.create({
        userId,amount,category,vendorName,paymentMethod
    })

    budget.spent += amount ? Number(amount) : 0;

    const budgetReport  = checkBudgetLimit(budget)
    budget = budgetReport[2]

    await budget.save()

    res.status(201).json({
        "mess":"Expense added succesfully",
        expenseId:expense._id,
        amount:expense.amount,
        category:expense.category,
        paymentMethod:expense.paymentMethod,
        vendorName:expense.vendorName,
        note:expense.note,
        notificationAlert:budgetReport[0],
        percentUsed:budgetReport[1]
    })


    

}

const getAllExpense = async(req,res)=>{
    const {userId} = req.user
    const budget = await budgetModel.findOne({
        userId
    })

    const expenses = await expenseModel.find({
        userId,
    })

    res.status(201).json({expenses,
        amount:budget.amount,
        spent:budget.spent,
        percentUsed:(budget.spent/budget.amount)*100
    })
}




export default {createExpenseController,updateExpenseController,deleteExpenseController,createExpenseByImage,getAllExpense}