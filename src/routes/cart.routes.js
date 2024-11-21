import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/roleAuth.middleware.js";
import {
  getCart,
  addToCart,
  removeProductFromCart
} from "../controllers/cart.controller.js"


const router = Router()

router.route('/get-cart').get(verifyJwt,checkRole('buyer'),getCart)
router.route('/add-cart').post(verifyJwt,checkRole('buyer'),addToCart)
router.route('/remove-cart').delete(verifyJwt,checkRole('buyer'),removeProductFromCart)

export default router;