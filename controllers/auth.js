import { json } from "express"
import { db } from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

//Register User
const generateRandomUserID = async(model) => {
    var flag = 1;
    while (flag) {
        const randomId = crypto.randomBytes(5).toString('hex')

        const q = `SELECT * FROM ${model} WHERE id = ?`
        db.query(q, randomId, (err, data) => {
            if (err) console.log(err);
            if(data.length === 0){flag = 0}
        })
    }

    return randomId
}

const clientURL = "http://localhost:3000"


export const register = (req, res) => {

    const q = "SELECT * FROM student WHERE email = ?"

    const { email, password, name, roll, phone } = req.body

    db.query(q, [email], (err, data) => {
        if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'});
        
        //checks existing user
        if (data.length) return res.status(409).json({message : "User already exists", status: 'error'});

        //hash the password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);

        //insert user into table
        const q_ad = "INSERT INTO admin(name, phone, position, password, email) VALUES (?)"
        const q_st = "INSERT INTO student(name, roll, phone, password, email) VALUES (?)"

        const values = [
            name,
            roll,
            phone,
            hash,
            email,
        ]

        db.query(q_st, [values], (err, data) => {
            if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'});

            return res.status(201).json({message : "Student Created", status: 'success'});
        })

    })
}


//Login User
export const login = (req, res) => {

    const PRIVATE_KEY = "jwtkey"

    const q_st = "SELECT * FROM student WHERE email = ?"
    const q_ad = "SELECT * FROM admin WHERE email = ?"

    const { user_type, username } = req.body

    console.log('username : ', username, 'role : ', user_type)

    const q = (user_type === 'admin') ? q_ad : q_st

    db.query(q, [username], (err, data) => {
        if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})

        //check if user does not exist
        if (data.length === 0) return res.status(404).json({message : "No user found", status: 'error'});

        //check correct password
        try {
            const isPasswordCorrect = bcrypt.compareSync(req.body.password, data[0].password)
            if (!isPasswordCorrect) return res.status(400).json({message : "Invalid credentials", status: 'error'})
        } catch (error) {
            return res.status(500).json({message : "Something went wrong !", status: 'error'})
        }

        //generate jwt token
        const token = jwt.sign(
            { id: data[0].id },
            PRIVATE_KEY   //secret key
        )

        const { id, password, ...other } = data[0]

        res.cookie("access_token", token, {
            httpOnly: true
        }).status(200).json({ isuserloggedin: true, authorizedAs: user_type, username: data[0].name })

    })

}

//Logout User
export const logout = (req, res) => {

    res.clearCookie("access_token", {
        sameSite: "none",
        secure: true
    }).status(200).json({message : "User has been logged out", status: 'success'})
}



export const forgotPassword = (req, res) => {

    //generate a reset token
    let resetToken = crypto.randomBytes(32).toString("hex");

    //hashing the reset token
    const salt = bcrypt.genSaltSync(10);
    const hashedToken = bcrypt.hashSync(resetToken, salt);

    const q = "SELECT * FROM student WHERE email = ?"

    db.query(q, [req.body.username], (err, data) => {
        if (err) return res.json(err);
        if (data.length === 0) return res.status(404).json("ERROR : No user found");

        const userID = data[0].id

        //creating password reset link
        const resetLink = `${clientURL}/passwordReset?token=${resetToken}&id=${userID}`;

        //storing token in database
        const q_token = "INSERT INTO token(value, user_id) VALUES (?)"

        const values = [
            hashedToken,
            userID,
        ]

        db.query(q_token, [values], (err, data) => {
            if (err) return res.json(err);
            
            //reset link sent from server
            return res.status(200).json({link: resetLink})
    
        })
    })
}

export const resetPassword = async (req, res) => {
    const userToken = req.body.token
    const userID = req.body.id

    const q_token = "SELECT * FROM token WHERE user_id = ?"

    db.query(q_token, [userID], (err, data) => {
        if (err) return res.json(err);

        //check if token exists
        if (data.length === 0) return res.status(404).json("ERROR : Please try after sometime");

        //check correct password
        const isTokenValid = bcrypt.compareSync(userToken, data[0].value)
        
        console.log('token : ', userToken, 'isvalid : ', isTokenValid)

        if (!isTokenValid) return res.status(409).json("Invalid Token")

        //hash the new password and store in database
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const q_st = "UPDATE student SET password = ? WHERE id = ?"

        const values = [
            hash,
            userID,
        ]
        
        db.query(q_st, values, (err, data) => {
            if (err) return res.json(err);
            return res.status(200).json('Your password has been successfully changed');
        })

    })

}

export const changePassword = async (req, res) => {
    const { userId, password0, password1 } = req.body

    const q = "SELECT * FROM student WHERE roll = ?"

    db.query(q, [userId], (err, data) => {
        if (err) return res.json(err);

        //check if token exists
        if (data.length === 0) return res.status(404).json({status: 'error', statusCode: 404, message : "ERROR : User does not exist"});

        //check correct password
        const isUserValid = bcrypt.compareSync(password0, data[0].password)
        
        console.log('userid : ', userId, 'isvalid : ', isUserValid, 'password0 : ', password0, 'password1 : ', password1)

        if (!isUserValid) return res.status(409).json({status: 'error', statusCode: 409, message : "ERROR : Incorrect credentials"})

        //hash the new password and store in database
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password1, salt);

        const q_st = "UPDATE student SET password = ? WHERE id = ?"

        const values = [
            hash,
            data[0].id,
        ]

        db.query(q_st, values, (err, data) => {
            if (err) return res.json(err);
            return res.status(200).json({status: 'success', statusCode: 209, message : "Your password has been successfully changed"});
        })

    })

}