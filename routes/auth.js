import express from "express"
import { changePassword, forgotPassword, login, logout, register, resetPassword } from "../controllers/auth.js"
import { authMiddleware } from "../middlewares/auth.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.post("/forgotPassword", forgotPassword)
router.post("/resetPassword", resetPassword)
router.post("/changePassword", authMiddleware, changePassword)

export default router;