import express from "express"
import { getAllocatedUsers, getAllUsers, getNotAllocatedUsers, getUser, updateUser } from "../controllers/users.js"
import { authMiddleware } from "../middlewares/auth.js"

const router = express.Router()

router.get("/getUsers", getAllUsers)
router.get("/getUsers/blank", getNotAllocatedUsers)
router.get("/getUsers/notBlank", getAllocatedUsers)
router.get("/getUser", authMiddleware, getUser)
router.put("/updateUser/", authMiddleware, updateUser)

export default router;