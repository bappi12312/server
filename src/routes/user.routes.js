import { Router } from "express";
import {
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
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { checkRole } from "../middlewares/roleAuth.middleware.js";


const router = Router()

router.route('/register').post(registerUser)
router.route('/login').post(loginUser)
router.route('/logout').post(logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/current-user').get(verifyJwt,getCurrentUser)
router.route('/update-account').patch(verifyJwt,updateAccountDetails)
router.route('/users').get(verifyJwt,checkRole('admin'),getUsers)
router.route('/change-user-role').patch(verifyJwt,checkRole('admin'),changeUserRole)
router.route('/delete-user').delete(verifyJwt,checkRole('admin'),deleteUser)
router.route('/add-wishlist').patch(verifyJwt,checkRole('buyer'),addToWishlist)
router.route('/remove-wishlist').delete(verifyJwt,checkRole('buyer'),removeWishlist)
router.route('/get-whishlist').get(verifyJwt,checkRole('buyer'),getWishlist)

export default router;

