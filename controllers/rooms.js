import { db } from "../db.js"

export const getRooms = (req, res) => {

    const{ status } = req.params
    const q = "SELECT * FROM rooms WHERE status = ?"

    db.query(q, status, (err, data) => {
        if (err) {return res.json(err)}

        return res.status(200).json(data)
    })
}

export const getRoom = (req, res) => {

    const { id } = req.params

    const q = "SELECT * FROM rooms WHERE id = ?"

    db.query(q, id, (err, data) => {
        if (err) return res.json(err)
        if(data.length === 0) return res.status(404).json("Room not found")

        return res.status(200).json(data)
    })
}

export const addRooms = (req, res) => {

    //status: 0 => Vacant, status: 1 => Occupied

    const q = "INSERT INTO rooms(block, roomno) VALUES (?)"

    const values = [
        req.body.block,
        req.body.roomNo,
    ]

    db.query(q, [values], (err, data) => {
        if(err) {return res.json(err)}

        return res.status(200).json('Room added')
    })
}

export const updateRoom = (req, res) => {

    const q = "UPDATE rooms SET status = ? WHERE id = ?"

    const { id, status } = req.params

    db.query(q, [status, id], (err, data) => {
        if(err) {return res.json(err)}

        return res.status(200).json('Room successfully alloted')
    })
}