import { db } from "../db.js"

export const getAllUsers = (req, res) => {
    const q = "SELECT name, roll, phone, block, room, email FROM student"

    db.query(q, (err, data) => {
        if (err) return res.send(err)

        return res.status(200).json(data)
    })
}

export const getNotAllocatedUsers = (req, res) => {
    const q = "SELECT name, roll, phone, email FROM student WHERE block IS NULL"

    db.query(q, (err, data) => {
        if (err) return res.status(500).json({message: err, status: 'error'});

        return res.status(200).json({message: data, status: 'success'})
    })
}

export const getAllocatedUsers = (req, res) => {
    const q = "SELECT (name, roll, phone, block, room, email) FROM student WHERE block IS NOT NULL"

    db.query(q, (err, data) => {
        if (err) return res.send(err)

        return res.status(200).json({dataSet : data, status: 'success'})
    })
}

export const getUser = (req, res) => {

    const u_id = req.userID
    const { role } = req.query

    const q = `SELECT * FROM ${role} WHERE id = ?`

    db.query(q, u_id, (err, data) => {
        if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})

        if(data.length === 0) return res.status(404).json({message : "User does not exist", status: 'error'})

        const { id, password, ...other} = data[0]

        return res.status(200).json({dataSet : other, status: 'success'})
    })
}

export const updateUser = (req, res) => {

    const u_id = req.userID

    const { field } = req.body
    const { role } = req.query

    if (field == 'contact') {
    
        const q = `UPDATE ${role} SET phone = ? WHERE id = ?`
    
        db.query(q_st, [req.body.contact, req.userID], (err, data) => {
            if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})
    
            return res.status(200).json({message: "Profile successfully updated", status: 'success'})
        })
    }
    if (field == 'room'){

        const [ block, room ] = req.body.roomData.split('-')
        const { studentData } = req.body

        const values = [
            room,
            block,
            studentData
        ]
    
        const q = "UPDATE student SET room = ?, block = ? WHERE roll = ?"

        db.query(q, values, (err, data) => {
            if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})
    
            return res.status(200).json({message: "Room successfully alloted", status: 'success'})
        })

    }
    

    }