import { db } from "../db.js"

export const getRooms = (req, res) => {

    const { status } = req.params
    const q = "SELECT * FROM rooms WHERE status = ?"

    db.query(q, status, (err, data) => {
        if (err) return res.status(500).json({message: 'Something went wrong !', status: 'error'})

        return res.status(200).json({message: data, status:'success'})
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

    //status: 0 => Vacant, 1 => Occupied
    const q = "INSERT INTO rooms(block, roomno) VALUES (?)"

    const values = [
        req.body.block,
        req.body.roomNo,
    ]

    db.query(q, [values], (err, data) => {
        if(err) {return res.json(err)}

        return res.status(201).json('New Room added')
    })
}

export const updateRoom = (req, res) => {

    //status --> 1: allocation, 0: clear
    const status = 1

    const [ block, room ] = req.body.roomData.split('-')

    const q = "UPDATE rooms SET status = ? WHERE block = ? AND roomno = ?"

    db.query(q, [status, block, room], (err, data) => {
        if(err) res.status(500).json({message: 'Something went wrong !', status: 'error'})
        
        //if no error
        return res.redirect('/users/updateUser/')
    })
}