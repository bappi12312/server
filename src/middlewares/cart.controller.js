import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { uploadOnCloudinary } from "../utlis/cloudinary.js";
import { isValidObjectId } from "mongoose";
import { Cart } from "../models/cart.model.js";

// get cart by specific user
const getCart = asyncHandler(async(req,res) => {
  try {
    const cart = await Cart.findOne({user: req.user?._id}).populate("items.product")

    if (!cart) return res.json({ items: [] });

    return res.status(200).json(
      new ApiResponse(200,cart,"get products cart")
    )
  } catch (error) {
    
  }
})