import { db } from "../db.js"

export const getUsers = (req, res) => {
    const q = "SELECT * FROM student"

    db.query(q, (err, data) => {
        if (err) return res.send(err)

        return res.status(200).json(data)
    })
}

export const getUser = (req, res) => {

    const { id } = req.params


    const q = "SELECT * FROM student WHERE id = ?"

    db.query(q, id, (err, data) => {
        if (err) return res.json(err)
        if(data.length === 0) return res.status(404).json("User not found")

        return res.status(200).json(data)
    })
}

export const updateUser = (req, res) => {

    const { id } = req.params

    const values = [
        req.body.contact,
        id
    ]

    const q = "UPDATE student SET phone = ? WHERE id = ?"

    db.query(q, [req.body.contact, id], (err, data) => {
        if (err) return res.json(err)

        return res.status(200).json({stat: 'Your profile is successfully updated'})
    })

}