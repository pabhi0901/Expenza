import mongoose from "mongoose";

const userSchema = mongoose.Schema({

    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    googleId:{
        type:String,
        required:true
    },
    googleRefreshToken:{
        type:String,
        required:true
    },
    googleAccessToken:{
        type:String
    },
    avatar:{
        type:String
    },
    lastSynced: {
     type: Date,
     default: Date.now
    },
    firstTime:{
    type:Boolean,
    default:true
    }

    },{
        timestamps:true
    })

    const userModel = mongoose.model("user",userSchema)

    export default userModel