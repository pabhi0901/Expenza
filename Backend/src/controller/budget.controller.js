import budgetModel from "../models/budget.model.js";
import userModel from "../models/user.model.js";

const setBudget = async (req, res) => {
  console.log("Request aa gu");
  
  try {
    const { amount } = req.body;
    const now = new Date();
    const month = now.getMonth() + 1; // 0–11 hota hai month
    const year = now.getFullYear();
    
    let budget = await budgetModel.findOne({userId:req.user.userId})

    if(budget){
      return res.status(400).json({
        "mess":"Budget for this user has already been created, you can update it only"
      })
    }

     budget = await budgetModel.create({
      amount: Number(amount),
      userId: req.user.userId,
      lastResetMonth: month,
      lastResetYear: year,
    });
    
    

    const user = await userModel.findOneAndUpdate({
      _id:req.user.userId          
    },
    {firstTime:false},
    {new:true})

   
    console.log("Budget save");
    

    res.status(201).json({
      message: "Budget saved successfully",
      budget,
    });


  } catch (err) {
    console.error("Budget updation failed ", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const updateBudget = async (req, res) => {
  try {
    let { amount } = req.body;
    const { userId } = req.user;

    amount = Number(amount);

    const budget = await budgetModel.findOneAndUpdate(
      {
        userId,
      },
      {
        amount,
      },
      {
        new: true,
      }
    );

    res.status(201).json({
      mess: "Budget updated successfully",
      budget,
    });
  } catch (err) {
    console.error("Budget updation failed ", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getBudget = async(req,res)=>{
    try{

        const budget = await budgetModel.findOne({
            userId:req.user.userId
        })

        const spent = budget.spent
        const amount = budget.amount

        const usedBudgetPercent = Number(((spent/amount)*100).toFixed(2))

        res.status(200).json({
            "mess":"Here is your budget",
            data:{
                spent,amount,usedBudgetPercent
            }
        })

    }
    catch(err){
    console.error("Error getting budget", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
    }
}

export default {setBudget , updateBudget,getBudget}