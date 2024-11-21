import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { ApiError } from "../utlis/ApiError.js"

export const verifyJwt = asyncHandler(async (req, _,next) => {

  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

    if (!token) {
      throw new ApiError(401, "unauthorized access token")
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

    if(!user){
      throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token")
  }
})