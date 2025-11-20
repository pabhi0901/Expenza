import jwt from "jsonwebtoken"

const authMiddleware = async(req,res,next)=>{

    const token = req.cookies.token||req?.headers["authorization"]?.split(" ")[1]
    
    if(!token){
        return res.status(400).json({
            "mess":"Unauthorised, login to continue"
        })
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET)
        req.user = decoded
        next()
    }catch(err){
        res.status(401).json({
            "mess":"Unauthorised, login to continue"
        })
    }


}

export default authMiddleware