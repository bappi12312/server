import jwt from "jsonwebtoken"
import mongoose, { isValidObjectId } from "mongoose"
import { ApiError } from "../utlis/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"


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
      image: image || "",
      password,
      wishList: [],
      cart: [],
      status: 'pending',
      role: 'buyer'
    })

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
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1
      }
    },
    { new: true }
  )


  const options = {
    httpOnly: true,
    secure: true
  }

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new ApiResponse(
        200, {}, "User logout successfully"
      )
    )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
      throw new ApiError(401, "Invalid refresh token")
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }
    const { accessToken, newrefreshToken } = await generateAccessAndRefreshTokens(user._id)
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newrefreshToken },
          "Access token refreshed successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { name, email } = req.body
  if (!name && !email) {
    throw new ApiError(400, "All fields are required")
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          name,
          email
        }
      },
      { new: true }
    ).select("-password")

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully!!"))
  } catch (error) {
    throw new ApiError(400, "error while updating account details")
  }
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")
})



// wishlist controllers

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;

  try {
    const user = await User.findById(req.user?._id);
    if (user.wishlist.includes(productId)) {
      return res.status(400).send('Product already in wishlist');
    }
    user.wishlist.push(productId);
    await user.save();
    res.send('Product added to wishlist');
  } catch (error) {
    res.status(500).send(error.message);
  }
})

// remove wishlist 
const removeWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params || req.body;
  try {
    const user = await User.findById(req.user?._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the product exists in the user's wishlist
    const productIndex = user.wishList.indexOf(productId)

    if (productIndex === -1) {
      return res.status(400).json({ success: false, message: 'Product not in the wishlist' });
    }

    user.wishList.splice(productIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist successfully',
      wishlist: user.wishList, // Return updated wishlist
    });
  } catch (error) {
    console.error('Error removing wishlist item:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
})

// get wishlist
const getWishlist = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).send(error.message);
  }
})


// admin controller
// get users by admin
const getUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({})
    if (!(users || Array.isArray(users) || users.lenght > 0)) {
      throw new ApiError(202, "Users not found")
    }

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: 'error while fetching users'
    });
  }
})

// change User role by admin
const changeUserRole = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  if (!isValidObjectId(userId)) throw new ApiError(400, "invalid userid")

  const validRoles = ["admin", "seller", "buyer"]; // Example roles
  if (!validRoles.includes(role)) {
    throw new ApiError(400, `Invalid role. Valid roles are: ${validRoles.join(", ")}`);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          role
        }
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    res.status(200).json({
      status: 200,
      message: "User role updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    throw new ApiError(500, error.message)
  }
})

// delete user by admin
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "invalid userid")
  }

  try {
    await User.findByIdAndDelete(
      userId,
      {
        isDeleted: true
      }
    )
    return res.status(200).json(
      new ApiResponse(200, "user delte successfully")
    )
  } catch (error) {
    throw new ApiError(400, "error deleting a user")
  }
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updateAccountDetails,
  getCurrentUser,
  getUsers,
  changeUserRole,
  deleteUser,
  addToWishlist,
  removeWishlist,
  getWishlist
}
