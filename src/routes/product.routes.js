import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/roleAuth.middleware.js";
import {
  addproduct,
  getProductById,
  getAllProduts,
  getProductsBySeller,
  deleteProductBySeller,
  updateProductBySeller
} from "../controllers/product.controller.js"

const router = Router()

router.route('/add-product').post(upload.fields([
  {
    name: "image",
    maxCount: 1
  }
]), verifyJwt, checkRole('seller'), addproduct)
router.route('/all-product').get(verifyJwt, getAllProduts)
router.route('/delete-product').delete(verifyJwt, checkRole('seller'), deleteProductBySeller)
router.route('/product/:id').get(verifyJwt, getProductById)
router.route('/product-seller/:sellerId').get(verifyJwt, checkRole('seller'), getProductsBySeller)
router.route('/update-product/:productId').patch(verifyJwt, checkRole('seller'), updateProductBySeller)

export default router
