import { json } from "express"
import { db } from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

//Register User
export const register = (req, res) => {

    //checks existing user

    const q = "SELECT * FROM admin WHERE email = ?"

    db.query(q, [req.body.email], (err, data) => {
        if (err) return res.json(err);
        if (data.length) return res.status(409).json("Admin already exists");

        //hash the password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        //insert user into table
        const q = "INSERT INTO admin(name, phone, position, password, email) VALUES (?)"
        const values = [
            req.body.name,
            req.body.phone,
            req.body.position,
            hash,
            req.body.email,
        ]

        db.query(q, [values], (err, data) => {
            if (err) return res.json(err);
            return res.status(200).json("Admin Created");
        })
    })
}


//Login User
export const login = (req, res) => {
    const q = "SELECT * FROM student WHERE roll = ?"

    db.query(q, [req.body.roll], (err, data) => {
        if (err) return res.json(err);
        if (data.length === 0) return res.status(404).json("No user found !");

        //check password
        const isPasswordCorrect = bcrypt.compareSync(req.body.password, data[0].password)

        if (!isPasswordCorrect) return res.status(400).json("Wrong username or password !")

        const token = jwt.sign({ id: data[0].id }, "jwtkey")
        const { password, ...other } = data[0]

        res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json(other)

    })

}

//Logout User
export const logout = (req, res) => {
    res.clearCookie("access_token", {
        sameSite: "none",
        secure: true
    }).status(200).json("User has been logged out")
}