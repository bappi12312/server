import mongoose from "mongoose"
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
    default: ""
  },
  price: {
    type: Number,
    required: true,
  },
  brand: {
    type: String,
    required: true,
    index: true,
  },
  category: {
    type: String,
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  images: {
    type: String,
    required: true,
    default: ""
  }
},{timestamps: true})


productSchema.plugin(mongooseAggregatePaginate)

export const Product = mongoose.model("Product",productSchema)