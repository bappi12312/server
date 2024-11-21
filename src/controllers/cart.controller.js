import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { uploadOnCloudinary } from "../utlis/cloudinary.js";
import { isValidObjectId } from "mongoose";
import { Cart } from "../models/cart.model.js";

// get cart by specific user
const getCart = asyncHandler(async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user?._id }).populate("items.product")

    if (!cart) return res.json({ items: [] });

    return res.status(200).json(
      new ApiResponse(200, cart, "get products cart")
    )
  } catch (error) {

  }
})

// add to cart controller by a seller
const addToCart = asyncHandler(async (req, res) => {
  const { porductId, quantity } = req.body;

  if (!isValidObjectId(porductId)) {
    throw new ApiError(400, "invalid productID")
  }

  try {
    let cart = await Cart.findOne({
      user: req.user?._id
    })

    if (!cart) {
      cart = new Cart({
        user: req.user?._id,
        items: []
      })
    }

    const itemIndex = cart.items?.findIndex(item => item.product.toString() === porductId)

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: porductId, quantity: 1 })
    }

    await cart.save()

    return res.status(200).json(
      new ApiResponse(200, cart?.items, "product added to cart successfully")
    )
  } catch (error) {
    throw new ApiError(500, error?.message)
  }
})

// remove product from cart
const removeProduct = asyncHandler(async (req, res) => {
  const { porductId } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.user?._id })
    if (!cart) {
      throw new ApiError(400, "cart not found")
    }

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === porductId)

    if (itemIndex === -1) {
      throw new ApiError(404, "product not found in cart")
    }

    cart.items.splice(itemIndex, 1)
    await cart.save()

    return res.status(200).json(
      new ApiResponse(200, cart?.items, "product remove from cart successfully")
    )
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
})

export {
  getCart,
  addToCart,
  removeProduct
}