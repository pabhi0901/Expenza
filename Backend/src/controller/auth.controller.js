import budgetModel from "../models/budget.model.js";
import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken"

const loginSignupController = async(req,res)=>{

try{
   const email = req.user.profile._json.email
const userDetails = req.user.profile._json

let user  = await userModel.findOne({
   email
})

if(user){
   
   if (req.user.refreshToken) {
    user.googleRefreshToken = req.user.refreshToken;
   }
   user.googleAccessToken = req.user.accessToken

   await user.save()
   console.log("login case");
   
}
else
{

   user = await userModel.create({
      name:userDetails.name,
      email:email,
      googleId:userDetails.sub,
      googleRefreshToken:req.user.refreshToken,
      googleAccessToken:req.user.accessToken,
      avatar:userDetails.picture,
   })
      console.log("signup case");

}




   const token = jwt.sign({
      userId:user._id,
   },process.env.JWT_SECRET,{expiresIn:'1d'})

   res.cookie("token", token, {
   httpOnly: true,
   secure: false,    // localhost me false
   sameSite: "lax",
   maxAge: 24 * 60 * 60 * 1000 // 1 day
   });
   
   // Redirect to frontend callback with user data
   const userData = encodeURIComponent(JSON.stringify({
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      firstTime: user.firstTime,
   }));
   
   res.redirect(`http://localhost:5173/auth/callback?data=${userData}`);



}
catch(err){

   res.status(500).json({
      "mess":"Error in login from our side, please try again later"
   })
   console.log("Error in login signup from our side ", err);
   
}

}

export default {loginSignupController}