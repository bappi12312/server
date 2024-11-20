import mongoose from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowerCase: true
  },
  image: {
    type: String,
    required: true,
    default: ''
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  wishList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    }
  ],
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart'
    }
  ],
  status: ['pending','approved','cancled']
}, { timestamps: true })


userSchema.pre("save",async function(next) {
  if(!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password,10);
  next()
})

userSchema.methods.generateAccessToken = function() {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name
    },
    process.env.ACCESS_TOKEN_SECRET ,
    {
      expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
      {
          _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
          expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
  )
}

export const User = mongoose.model("User",userSchema)