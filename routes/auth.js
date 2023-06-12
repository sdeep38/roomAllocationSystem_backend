import express from "express"
import { changePassword, forgotPassword, login, logout, register, resetPassword } from "../controllers/auth.js"

const router = express.Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.post("/forgotPassword", forgotPassword)
router.post("/resetPassword", resetPassword)
router.post("/changePassword", changePassword)

export default router;