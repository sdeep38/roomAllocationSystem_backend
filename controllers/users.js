import { db } from "../db.js"

export const getUsers = (req,res) => {
    const q = "SELECT * FROM student"

    db.query(q, (err,data) => {
        if(err) return res.send(err)

        return res.status(200).json(data)
    })
}