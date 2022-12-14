import express from "express"
import { getUser, getUsers, updateUser } from "../controllers/users.js"

const router = express.Router()

router.get("/getUsers", getUsers)
router.get("/getUser/:id", getUser)
router.put("/updateUser/:id", updateUser)

export default router;