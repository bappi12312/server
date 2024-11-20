import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { uploadOnCloudinary } from "../utlis/cloudinary.js";


const addproduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, brand } = req.body;

  if (
    [name, description, price, category, brand].some((item) => item?.trim() === '')
  ) {
    throw new ApiError(400, "all fields must be required")
  }

  const seller = req.user?._id;
  if (!seller) {
    throw new ApiError(401, "no seller specified")
  }

  try {

    const productImageLocalPath = req.files?.image[0]?.path

    if (!productImageLocalPath) {
      throw new ApiError(400, "no product image found")
    }

    const productImage = await uploadOnCloudinary(productImageLocalPath)

    if (!productImage) {
      throw new ApiError(400, "porduct image file is required")
    }

    const product = await Product.create({
      name,
      description: '',
      price,
      category,
      brand,
      image: productImage?.url || "",
      seller

    })

    if(!product) {
      throw new ApiError(400,"product not found")
    }

    return res.status(201).json(
      new ApiResponse(200, product, "product added successfully")
  )
  } catch (error) {
    res.status(400).send(error.message);
  }
}) 

const getProductById = asyncHandler(async(req,res) => {
  try {
    const product = await Product.findById(req.params.id)
    if(!product) {
      throw new ApiError(400,"product not found")
    }

    return res.status(200).json(
      new ApiResponse(200,product,"product find succsfully")
    )
  } catch (error) {
    
  }
})


export {
  addproduct,
  getProductById
}