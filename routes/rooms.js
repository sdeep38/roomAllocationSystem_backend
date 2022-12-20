import express from "express"
import { addRooms, getRoom, getRooms, updateRoom } from "../controllers/rooms.js"


const router = express.Router()

router.get('/getRooms/:status', getRooms)
router.get('/getRoom/:id', getRoom)
router.put('/updateRoom/:status/:id', updateRoom)
router.post('/addRooms', addRooms)

export default router;