import expenseModel from "../models/expense.model.js";
import budgetModel from "../models/budget.model.js";
import imageConvertFunction from "../services/tesseract.service.js";
import aiBillingFunctions from "../services/ai.service.js";
import userModel from "../models/user.model.js";
import sendEmail from "./../services/email.service.js";
import getGmailsOfUser from "../services/emailRead.service.js";

const checkMonthChange = (budget) => {
  const now = new Date();
  const month = now.getMonth() + 1; // 0–11 hota hai month
  const year = now.getFullYear();

  if (month != budget.lastResetMonth || year != budget.lastResetYear) {
    budget.lastResetMonth = month;
    budget.lastResetYear = year;
    budget.spent = 0;

    for (let key in budget.flags) {
      budget.flags[key] = false;
    }
  }

  return budget;
};

const checkBudgetLimit = async (budget) => {
  const spent = budget.spent;
  const amount = budget.amount;
  const percentUsed = Math.floor((spent / amount) * 100);
  const user = await userModel.findById(budget.userId)
  if (percentUsed >= 100 && budget.flags.hundred == true) {
    await sendEmail(
      user.email,
      `🚨 Budget Exceeded – ${percentUsed}% Used`,
      `
      <p>Hi ${user.name},</p>

      <p><strong style="color:#b30000;">Your spending has exceeded your monthly budget.</strong></p>

      <p>You’ve used <strong>${percentUsed}% of your budget</strong>, which means your expenses have gone beyond your planned financial limit for this month.</p>

      <p>This can impact your savings and may create unnecessary financial pressure. Please review your recent transactions and try to pause all non-essential spending for the remaining days.</p>

      <p>It’s a good idea to revise your budget plan, analyze high expense areas, and adjust your spending habits to avoid future overflow.</p>

      <p>Stay mindful and stay in control.</p>

      <p>– <strong>Team Expenza</strong></p>
      `
    );
  } 


  //flags are been used for checking wheather the notification has been sended earlier for this percent or not

  //eg:- here check if budget is >=100 then  mark all flags true (means for 60,80,100 the flags only one 100% will be sended and return true and percentUsed, that true in return will be used in frontend for deciding wheather we have to show the notification to user or not and percentUsed will be used in the progressBar )

  if (percentUsed >= 100 && budget.flags.hundred == false) {
    budget.flags.hundred = true;
    budget.flags.eighty = true;
    budget.flags.sixty = true;
    await sendEmail(
      user.email,
      `⚠️ Critical Alert – ${percentUsed}% Budget Used`,
      `
      <p>Hi ${user.name},</p>

      <p>You’ve crossed <strong style="color:#d60000;">${percentUsed}% of your monthly budget</strong>, which means you are extremely close to your spending limit.</p>

      <p>At this stage, even small expenses can push your budget into overflow. Carefully evaluate every upcoming purchase and try avoiding anything that isn’t absolutely necessary.</p>

      <p>We recommend reviewing your Expenza dashboard to understand where most of your money went this month. Awareness is the first step to better control.</p>

      <p>Keep your financial priorities ahead.</p>

      <p>– <strong>Team Expenza</strong></p>
      `
    );
    return [true, percentUsed, budget];
  } else if (percentUsed >= 80 && budget.flags.eighty == false) {
    budget.flags.eighty = true;
    budget.flags.sixty = true;

    await sendEmail(
      user.email,
      `⚠️ Warning – ${percentUsed}% of Your Budget Used`,
      `
      <p>Hi ${user.name},</p>

      <p>You’ve crossed <strong style="color:#ff7a00;">${percentUsed}% of your monthly budget</strong>. Your spending is moving toward the upper limit.</p>

      <p>This is the right time to slow down on non-essential spending. Try to focus on necessary expenses only, so you don’t run into financial pressure near the month-end.</p>

      <p>Check your Expenza analytics for a detailed breakdown. Understanding your spending pattern will help you take better decisions.</p>

      <p>Make smart moves ahead.</p>

      <p>– <strong>Team Expenza</strong></p>
      `
    );

    return [true, percentUsed, budget];
  } else if (percentUsed >= 60 && budget.flags.sixty == false) {
    budget.flags.sixty = true;
    await sendEmail(
      user.email,
      `📈 Budget Update – ${percentUsed}% Used`,
      `
      <p>Hi ${user.name},</p>

      <p>You’ve crossed <strong>${percentUsed}% of your monthly budget</strong>. You’re halfway through your planned limit.</p>

      <p>This is a good point to evaluate your expenses so far. Managing the rest of the month will be much easier if you plan ahead and avoid unnecessary spending early on.</p>

      <p>Take a moment to go through your Expenza dashboard. Small adjustments now can prevent bigger issues later.</p>

      <p>Stay aware, stay ahead.</p>

      <p>– <strong>Team Expenza</strong></p>
      `
    );
    return [true, percentUsed, budget];
  } else {
    return [false, percentUsed, budget];
  }
};

//after we descrease amount in spended budget we check for flags and remark them accordingly
const remarkBudgetFlags = (budget) => {
  const { amount, spent } = budget;
  const spendPercent = Math.floor((spent / amount) * 100);

  if (spendPercent >= 100 && budget.flags.hundred == true) {
    budget.flags.hundred = false;
  } else if (spendPercent >= 80 && budget.flags.eighty == true) {
    budget.flags.hundred = false;
    budget.flags.eighty = false;
  }
  else {
    budget.flags.hundred = false;
    budget.flags.eighty = false;
    budget.flags.sixty = false;
  }

  return budget;
};

const createExpenseController = async (req, res) => {
  const {
    amount,
    category = "others",
    paymentMethod = "Other",
    vendorName = null,
    items = [],
    note = "",
    date = Date.now(),
  } = req.body;
  const { userId } = req.user;

  //creating an expense
  const expense = await expenseModel.create({
    userId,
    amount,
    category,
    paymentMethod,
    vendorName,
    items,
    note,
    date,
  });

  //finding the user budget
  let budget = await budgetModel.findOne({ userId });

  //checking for month change, if yes then reset the budget and update the month year
  budget = checkMonthChange(budget);

  //calculating total spent
  const totalSpent = Number(amount) + budget.spent;

  //updating the total money spent in the user budget schema
  budget.spent = totalSpent;

  const budgetReport = await checkBudgetLimit(budget);

  budget = budgetReport[2];
  await budget.save();

  res.status(201).json({
    mess: "Expense added succesfully",
    expenseId: expense._id,
    amount: expense.amount,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    vendorName: expense.vendorName,
    items: expense.items,
    note: expense.note,
    notificationAlert: budgetReport[0],
    percentUsed: budgetReport[1],
  });
};

const updateExpenseController = async (req, res) => {
  try {
    const {
      expenseId,
      amount,
      category,
      paymentMethod,
      vendorName,
      items = [],
      note = "",
    } = req.body;
    const { userId } = req.user;

    const expense = await expenseModel.findById(expenseId);
    let budget = await budgetModel.findOne({ userId });

    if (!expense || !budget) {
      return res.status(404).json({
        mess: "Some error occoured",
      });
    }

    budget = checkMonthChange(budget);

    let expenseDate = expense.date;
    let expenseMonth = expenseDate.getMonth() + 1;
    let expenseYear = expenseDate.getFullYear();

    if (
      budget.lastResetYear == expenseYear &&
      budget.lastResetMonth == expenseMonth
    ) {
      budget.spent -= Number(expense.amount);
      budget = remarkBudgetFlags(budget);

      budget.spent += Number(amount);

      let budgetReport = await checkBudgetLimit(budget);

      budget = budgetReport[2];

      if (amount != undefined) expense.amount = amount;
      if (category) expense.category = category;
      if (paymentMethod) expense.paymentMethod = paymentMethod;
      if (vendorName) expense.vendorName = vendorName;
      if (note) expense.note = note;
      if (items.length > 0) expense.items = items;

      await budget.save();
      await expense.save();

      res.status(201).json({
        mess: "Expense updated succesfully",
        expenseId: expense._id,
        amount: expense.amount,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        vendorName: expense.vendorName,
        items: expense.items,
        note: expense.note,
        notificationAlert: budgetReport[0],
        percentUsed: budgetReport[1],
      });
    }
    //month of expense and updating month are different so cannot update it.
    else {
      return res.status(403).json({
        mess: "Cannot update this expense",
      });
    }
  } catch (err) {
    console.log("Error updating the expense");
  }
};

const deleteExpenseController = async (req, res) => {
  const { expenseId } = req.body;
  const { userId } = req.user;

  const expense = await expenseModel.findOne({
    _id: expenseId,
    userId,
  });

  if (!expense) {
    return res.status(404).json({
      mess: "You can only delete your own expense",
    });
  }

  let budget = await budgetModel.findOne({ userId });

  if (!budget) {
    return res.status(404).json({
      mess: "Some error occoured while deleting the expense",
    });
  }

  budget = checkMonthChange(budget);

  let expenseDate = expense.date;
  let expenseMonth = expenseDate.getMonth() + 1;
  let expenseYear = expenseDate.getFullYear();

  if (
    budget.lastResetYear == expenseYear &&
    budget.lastResetMonth == expenseMonth
  ) {
    
    budget.spent -= Number(expense.amount);
    budget = remarkBudgetFlags(budget);

    await budget.save();
    await expenseModel.deleteOne({
      userId,
      _id: expenseId,
    });

    await budget.save();

    res.status(200).json({
      mess: "Expense deleted succesfully",
    });
  } else {
    res.status(400).json({
      mess: "You can delete the expense in same month only",
    });
  }
};

const createExpenseByImage = async (req, res) => {
  const { date = new Date() } = req.body;
  const image = req.file;
  const { userId } = req.user;

  let budget = await budgetModel.findOne({ userId });

  if (!budget) {
    return res.status(404).json({
      mess: "Some error occoured while creating expense",
    });
  }

  budget = checkMonthChange(budget);

  let billText;
  try {
    billText = await imageConvertFunction(image.buffer);
  } catch (err) {
    console.log("Error in generating ocr text ,", err);
  }

  let jsonBill;

  try {
    jsonBill = await aiBillingFunctions.createBillfromText(billText);
  } catch (err) {
    console.log("Error in generating bill from text ,", err);
  }

  console.log(jsonBill);
  const { amount, category, vendorName, paymentMethod } = jsonBill;

  const expense = await expenseModel.create({
    userId,
    amount,
    category,
    vendorName,
    paymentMethod,
    date,
  });

  budget.spent += amount ? Number(amount) : 0;

  const budgetReport = await checkBudgetLimit(budget);
  budget = budgetReport[2];

  await budget.save();

  res.status(201).json({
    mess: "Expense added succesfully",
    expenseId: expense._id,
    amount: expense.amount,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    vendorName: expense.vendorName,
    note: expense.note,
    notificationAlert: budgetReport[0],
    percentUsed: budgetReport[1],
  });
};

const getAllExpense = async (req, res) => {
  const { userId } = req.user;
  const budget = await budgetModel.findOne({
    userId,
  });

  const expenses = await expenseModel.find({
    userId,
  });

  res
    .status(201)
    .json({
      expenses,
      amount: budget.amount,
      spent: budget.spent,
      percentUsed: (budget.spent / budget.amount) * 100,
    });
};

const getEcommerceBills = async (req,res)=>{
  //getting userId
  const {userId} = req.user

  let budget = await budgetModel.findOne({ userId });

  if (!budget) {
    return res.status(404).json({
      mess: "Some error occoured while creating expense",
    });
  }

  budget = checkMonthChange(budget);

  const user = await userModel.findById(userId)
  //GETTING LIST OF EMAILS RELATED TO SOME ECOMMERCE OR FOOD APPS
  let emailList
  
  if(user){
     emailList =  await getGmailsOfUser(user)
  }
  let expenseList = []

  if(emailList.length>0){
  
    for(let i=0; i<emailList.length; i++){
      const res = await aiBillingFunctions.createBillfromEmail(emailList[i].html)
      
      if(res.mess!='Invalid'){
        
        const expense = await expenseModel.create({
          userId,
          amount:res.amount,
          category:res.category,
          vendorName:res.vendorName,
          paymentMethod:res.paymentMethod,
        });

        budget.spent += expense.amount ? Number(expense.amount) : 0;
        
        //pushing it into an array to return on frontend
        expenseList.push({
          expenseId: expense._id,
          amount: expense.amount,
          category: expense.category,
          paymentMethod: expense.paymentMethod,
          vendorName: expense.vendorName,
        })

      }
    }
  }

  
  const budgetReport = await checkBudgetLimit(budget);
  budget = budgetReport[2];

  await budget.save();
  user.lastSynced = Date.now()
  await user.save()

   res.status(201).json({
    mess: "Expense added succesfully",
    expenseList,
    notificationAlert: budgetReport[0],
    percentUsed: budgetReport[1],
  });
}
export default {
  createExpenseController,
  updateExpenseController,
  deleteExpenseController,
  createExpenseByImage,
  getAllExpense,
  getEcommerceBills
};
