import express from "express"
import { getUsers } from "../controllers/users.js"

const router = express.Router()

router.get("/getUsers", getUsers)
//router.post("/:id", )
//router.put("/:id", )

export default router;