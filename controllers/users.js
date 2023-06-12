import { db } from "../db.js"

export const getAllUsers = (req, res) => {
    const q = "SELECT * FROM student"

    db.query(q, (err, data) => {
        if (err) return res.send(err)

        return res.status(200).json(data)
    })
}

export const getNotAllocatedUsers = (req, res) => {
    const q = "SELECT * FROM student WHERE block IS NULL"

    db.query(q, (err, data) => {
        if (err) return res.send(err)

        return res.status(200).json(data)
    })
}

export const getAllocatedUsers = (req, res) => {
    const q = "SELECT (name, roll, phone, block, room, email) FROM student WHERE block IS NOT NULL"

    db.query(q, (err, data) => {
        if (err) return res.send(err)

        return res.status(200).json(data)
    })
}

export const getUser = (req, res) => {

    const u_id = req.userID

    const q_st = "SELECT * FROM student WHERE id = ?"
    const q_ad = "SELECT * FROM admin WHERE id = ?"

    db.query(q_ad, u_id, (err, data) => {
        if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})

        if(data.length === 0) return res.status(404).json({message : "User does not exist", status: 'error'})

        const { id, password, ...other} = data[0]

        return res.status(200).json({dataSet : other, status: 'success'})
    })
}

export const updateUser = (req, res) => {

    const u_id = req.userID

    const { contact, newRoom } = req.body

    if (contact) {
    
        const q_st = "UPDATE student SET phone = ? WHERE id = ?"
        const q_ad = "UPDATE admin SET phone = ? WHERE id = ?"
    
        db.query(q_st, [req.body.contact, u_id], (err, data) => {
            if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})
    
            return res.status(200).json({message: "Your profile is successfully updated", status: 'success'})
        })
    }
    if (newRoom){

        const values = [
            newRoom.roomno,
            newRoom.block,
            u_id
        ]
    
        const q_st = "UPDATE student SET room = ?, block = ? WHERE id = ?"
    
        db.query(q_st, values, (err, data) => {
            if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})
    
            return res.redirect(`/rooms/updateRoom/1/${newRoom.id}`)
        })

    }
    

    }