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
const PRIVATE_KEY = "jwtkey"


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

    const { user_type, username, password } = req.body

    const q = `SELECT * FROM ${user_type} WHERE email = ?`

    db.query(q, [username], (err, data) => {
        if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'})

        //check if user does not exist
        if (data.length === 0) return res.status(404).json({message : "No user found", status: 'error'});

        //check correct password
        try {
            let isPasswordCorrect = bcrypt.compareSync(req.body.password, data[0].password)
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

    const { username, user_type } = req.body

    const q = `SELECT * FROM ${user_type} WHERE email = ?`

    db.query(q, [username], (err, data) => {
        if (err) return res.status(500).json({message: err, status: 'error'})

        if (data.length === 0) return res.status(404).json({message: "No user found", status: 'error'})

        //generate jwt token
        let SECRET_KEY = PRIVATE_KEY + data[0].password
        const resetToken = jwt.sign(
            { id: data[0].id },
            SECRET_KEY,   //secret key
            {expiresIn: '5m'}   //token expiration time
        )

        //creating password reset link
        const resetLink = `${clientURL}/passwordReset/?resetToken=${resetToken}&user=${data[0].id}&role=${user_type}`

        return res.status(200).json({message: 'A verification link has been sent to your email', link: resetLink, status: 'success'})
    })
}

export const resetPassword = (req, res) => {
    
    const { password, token, user, role} = req.body

    const q = `SELECT * FROM ${role} WHERE id = ?`

    db.query(q, [user], (err, data) => {
        if (err) return res.status(500).json({message: 'Something went wrong !', status: 'error'})

        //check if user exists
        if (data.length === 0) return res.status(404).json({message: "No user found", status: 'error'})

        //decrypt token
        try {
            if(token) {
                let verified_user = jwt.verify(token, PRIVATE_KEY + data[0].password)
                // console.log('token user : ', verified_user, 'requesting user : ', user)
            }
            else {
                return res.status(401).json({message: 'Unauthorized User', status: 'error'})
            }
        } catch (error) {
            let messageText = (error.name === 'TokenExpiredError') ? {code: 408, label: 'Session expired'} : {code: 400, label: 'Authentication error'}
            return res.status(messageText.code).json({message: messageText.label, status: 'error'})
        }


        //hash the new password and store in database
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(password, salt)

        const q = `UPDATE ${role} SET password = ? WHERE id = ?`

        const values = [
            hash,
            user,
        ]
        
        db.query(q, values, (err, data) => {
            if (err) return res.status(200).json({message: 'Something went wrong !', status: 'error'})
            return res.status(200).json({message: 'Your password has been successfully changed', status: 'success'})
        })

    })

}

export const changePassword = async (req, res) => {
    const { password0, password1 } = req.body
    const { role } = req.query
    
    const q = `SELECT * FROM ${role} WHERE id = ?`
    
    db.query(q, [req.userID], (err, data) => {
        if (err) return res.status(500).json({message: 'Something went wrong !', status: 'error'});

        //check if user exists
        if (data.length === 0) return res.status(404).json({status: 'error', message : "User does not exist"});
        
        //check correct password
        try {
            let isUserValid = bcrypt.compareSync(password0, data[0].password)
            if (!isUserValid) return res.status(409).json({status: 'error', message : "Incorrect credentials"})
        } catch (error) {
            return res.status(500).json({message : "Something went wrong !", status: 'error'})
        }
        
        // console.log('userid : ', req.userID, 'password0 : ', password0, 'password1 : ', password1)
        
        //hash the new password and store in database
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password1, salt);
        
        const q = `UPDATE ${role} SET password = ? WHERE id = ?`
        
        const values = [
            hash,
            data[0].id,
        ]
        db.query(q, values, (err, data) => {
            if (err) return res.status(500).json({message : "Something went wrong !", status: 'error'});
            return res.status(200).json({status: 'success', message : "Password successfully updated"});
        })

    })

}