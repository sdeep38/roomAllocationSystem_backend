import express from "express"
import { addRooms, allocateRoom, allocateRoomController, checkRoomAvailability, getRoomByStudent, getRooms, releaseRoomLock, updateRoom } from "../controllers/rooms.js"
import { authMiddleware } from "../middlewares/auth.js"


const router = express.Router();

router.get('/getRooms/:status', authMiddleware, getRooms)
router.get('/getRoom/:student_id', getRoomByStudent)
router.put('/updateRoom/', updateRoom)
router.post('/addRooms', addRooms)
router.put('/allocateRoom', allocateRoomController)
router.post('/availability', authMiddleware, checkRoomAvailability)
router.post('/lock/release', authMiddleware, releaseRoomLock)

export default router;