import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { response } from "express"


const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }

  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, image } = req.body;

  if ([name, email, password].some((value) => value?.trim() === "")) {
    throw new ApiError(400, "all fields are required")
  }

  try {
    const existedUser = await User.findOne({ email })

    if (existedUser) {
      throw new ApiError(409, "user already exists")
    }

    const user = await User.create({
      name,
      email,
      image: "",
      password,
      wishList: [],
      cart: [],
      status: 'pending',
      role: 'buyer'
    })

    await user.save()

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    )
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user")
    }
    return res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    )
  } catch (error) {
    throw new ApiError(400, "error registering user")
  }
})


const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "all fields required")
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(404, "User does not exists")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
  }


  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,accessToken,refreshToken
      },
       "User logged in successfully"
    )
  )
})




export {
  registerUser,
  loginUser,
}
