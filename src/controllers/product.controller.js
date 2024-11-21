import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utlis/ApiResponse.js"
import { asyncHandler } from "../utlis/asyncHandler.js"
import { uploadOnCloudinary } from "../utlis/cloudinary.js";
import { isValidObjectId } from "mongoose";


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

    if (!product) {
      throw new ApiError(400, "product not found")
    }

    return res.status(201).json(
      new ApiResponse(200, product, "product added successfully")
    )
  } catch (error) {
    res.status(400).send(error.message);
  }
})

const deleteProductBySeller = asyncHandler(async (req, res) => {
  const { productId } = req.params || req.body;

  if (!productId || !isValidObjectId(productId)) {
    throw new ApiError(404, "productId is required")
  }

  try {
    // find product
    const product = await Product.findOne({
      _id: productId,
      seller: req.user?._id
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it',
      });
    }

    // delete the product
    await product.remove();


    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
})

const getProductById = asyncHandler(async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      throw new ApiError(400, "product not found")
    }

    return res.status(200).json(
      new ApiResponse(200, product, "product find succsfully")
    )
  } catch (error) {

  }
})

const getAllProduts = asyncHandler(async (req, res) => {
  const { category, brand, search = '', order = 'desc', sortBy = 'price', size = 10, page = 1 } = req.query;

  try {
    const limit = parseInt(size)
    const skip = (parseInt(page) - 1) * limit;
    const sortOrder = order === 'asc' ? 1 : -1;

    const filters = {}
    if (search) {
      filters.$or = [
        { category: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ]
    }

    const pipeline = [
      {
        $match: search ? filters : {},
      },
      {
        $sort: {
          [sortBy]: sortOrder
        }
      },
      { $skip: skip },
      { $limit: limit },
    ]

    const result = await Product.aggregate(pipeline)
    const total = await Product.countDocuments()

    if (!result?.length) {
      throw new ApiError(404, "result not fount")
    }

    return res
      .status(200)
      .json(
        {
          total,
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          sort: { field: sortBy, order },
          filters: search,
          data: result[0]
        }
      )
  } catch (error) {
    res.status(500).json({ message: 'error while fetching all products', error });
  }
})

const getProductsBySeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;

  if (!isValidObjectId(sellerId)) {
    throw new ApiError(404, "invalid seller id")
  }

  try {
    const products = await Product.find({ seller: sellerId }).populate("seller", "name email image")

    if (!(products.length < 0)) {
      return res.status(404).json({ message: 'No products found for this seller' });
    }

    res.status(200).json(
      new ApiResponse(200, products, "no products found for this seller")
    )
  } catch (error) {
    console.error('Error fetching products by seller:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
})

const updateProductBySeller = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const sellerId = req.user?._id;
  const updateData = req.body;

  if (!productId) {
    throw new ApiError(404, "productId is required")
  }
  try {
    const product = await Product.findOne({
      _id: productId,
      seller: sellerId
    })

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to update it',
      });
    }

    Object.keys(updateData).forEach((key) => {
      product[key] = updateData[key]
    })

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})



export {
  addproduct,
  getProductById,
  getAllProduts,
  getProductsBySeller,
  deleteProductBySeller,
  updateProductBySeller
}