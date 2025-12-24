import { json } from "express"
import { pool } from "../db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

//Register User
const generateRandomUserID = async (model) => {
    var flag = 1;
    while (flag) {
        const randomId = crypto.randomBytes(5).toString('hex')

        const q = `SELECT * FROM ${model} WHERE id = ?`
        db.query(q, randomId, (err, data) => {
            if (err) console.log(err);
            if (data.length === 0) { flag = 0 }
        })
    }

    return randomId
}

const clientURL = "http://localhost:3000";
const PRIVATE_KEY = "jwtkey";


export const register = async (req, res) => {

    try {
        const { email, password, name, roll, phone, position, role } = req.body;

        // Check if user already exists (search both tables if needed)
        const [existingStudent] = await db.query("SELECT * FROM student WHERE email = ?", [email]);
        const [existingAdmin] = await db.query("SELECT * FROM admin WHERE email = ?", [email]);

        if (existingStudent.length || existingAdmin.length) {
            return res.status(409).json({ message: "User already exists", status: "error" });
        }

        //hash the password
        const hash = bcrypt.hash(password, 10); // asynchronous method

        // Insert based on role
        if (role === "student") {
            const values = [name, roll, phone, hash, email];
            await db.query(
                "INSERT INTO student(name, roll, phone, password, email) VALUES (?)",
                [values]
            );
            return res.status(201).json({ message: "Student Created", status: "success" });

        } else if (role === "admin") {
            const values = [name, phone, position, hash, email];
            await db.query(
                "INSERT INTO admin(name, phone, position, password, email) VALUES (?)",
                [values]
            );
            return res.status(201).json({ message: "Admin Created", status: "success" });

        } else {
            return res.status(400).json({ message: "Invalid role specified", status: "error" });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong !", status: "error" });
    }
}


//Login User
export const login = async (req, res) => {
    try {
        const { user_type, username, password } = req.body;

        // Whitelist user_type
        const allowedTypes = ["student", "admin"];
        if (!allowedTypes.includes(user_type)) {
            return res.status(400).json({ message: "Invalid user type", status: "error" });
        }

        // Query user
        const [rows] = await pool.execute(`SELECT * FROM ${user_type} WHERE email = ?`, [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No user found", status: "error" });
        }

        const user = rows[0];

        // Check password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);    // asynchronous method
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials", status: "error" });
        }

        // Generate JWT
        const user_id = user_type === 'admin' ? user.admin_id : user.student_id;
        const payload = { id: user_id, role: user_type };

        const accessToken = jwt.sign(
            payload, // include role for future auth
            PRIVATE_KEY,
            { expiresIn: "1h" } // optional expiry
        );
        // const refreshToken = jwt.sign(
        //     payload,
        //     PRIVATE_KEY,
        //     { expiresIn: "7d" } // long-lived
        // );

        // Store refresh token in DB (optional, for revocation)
        // await pool.execute(
        //     "INSERT INTO token (value, user_id, user_type, expires_at) VALUES (?, ?, ?, ?)",
        //     [refreshToken, user_id, user_type, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
        // );

        // Remove sensitive fields
        const { password: _, ...safeUser } = user;

        // Send cookie + response
        res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: true,       // only over HTTPS
            sameSite: "strict", // CSRF protection
            maxAge: 60 * 60 * 1000, // 60 minutes
        }).status(200).json({
            isUserLoggedIn: true,
            authorizedAs: user_type,
            username: user.name,
            user: safeUser,
        });
        // .cookie("refresh_token", refreshToken, {
        //     httpOnly: true,
        //     secure: true,       // only over HTTPS
        //     sameSite: "strict", // CSRF protection
        //     maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        // })
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong!", status: "error" });
    }

}

//Logout User 
export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refresh_token;

        if (refreshToken) {
            // Mark refresh token as used/revoked in DB
            await pool.execute("UPDATE token SET used = 1 WHERE value = ?", [refreshToken]);
        }

        // Clear the cookies
        res.clearCookie("access_token", {
            httpOnly: true,   // match login cookie
            secure: true,     // only over HTTPS
            sameSite: "strict" // CSRF protection
        }).clearCookie("refresh_token", {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
        });

        return res.status(200).json({
            message: "User has been logged out",
            status: "success"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong!", status: "error" });
    }
}

export const forgotPassword = async (req, res) => {

    try {
        const { username, user_type } = req.body;

        // Whitelist user_type
        const allowedTypes = ["student", "admin"];
        if (!allowedTypes.includes(user_type)) {
            return res.status(400).json({ message: "Invalid user type", status: "error" });
        }

        // Query user
        const [rows] = await pool.execute(`SELECT * FROM ${user_type} WHERE email = ?`, [username]);
        if (rows.length === 0) {
            return res.status(404).json({ message: "No user found", status: "error" });
        }

        const user = rows[0];

        // Generate reset token (short-lived)
        const user_id = user_type === 'admin' ? user.admin_id : user.student_id;
        let RESET_SECRET = PRIVATE_KEY;
        const resetToken = jwt.sign(
            { id: user_id, role: user_type },
            RESET_SECRET,   // use a dedicated secret
            { expiresIn: "15m" }        // short expiry
        );

        // Calculate expiry timestamp
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        // Store token in DB
        await pool.execute(
            `INSERT INTO token (value, user_id, user_type, expires_at) VALUES (?, ?, ?, ?)`,
            [resetToken, user_id, user_type, expiresAt]
        );

        //creating password reset link
        const resetLink = `${clientURL}/passwordReset/?resetToken=${resetToken}`;
        return res.status(200).json({
            link: resetLink,
            message: "A verification link has been sent to your email",
            status: "success"
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Something went wrong!", status: "error" });
    }

}

export const resetPassword = async (req, res) => {
    const connection = await pool.getConnection(); // get a dedicated connection
    try {
        const { newPassword, resetToken } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Invalid session or password", status: "error" });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(resetToken, PRIVATE_KEY);
        } catch (err) {
            return res.status(400).json({ message: "Invalid or expired session", status: "error" });
        }

        const { id: user_id, role: user_type } = decoded;

        // Whitelist role
        const allowedTypes = ["student", "admin"];
        if (!allowedTypes.includes(user_type)) {
            return res.status(400).json({ message: "Invalid role", status: "error" });
        }

        // Start transaction
        await connection.beginTransaction();

        // Check token in DB
        const [rows] = await pool.execute(
            "SELECT * FROM token WHERE value = ? AND user_id = ? AND used = 0",
            [resetToken, user_id]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: "Invalid Session", status: "error" });
        }

        // Check if token expired
        const tokenRow = rows[0];
        if (new Date(tokenRow.expires_at) < new Date()) {
            await connection.rollback();
            return res.status(400).json({ message: "Session expired", status: "error" });
        }

        // Hash new password
        const hash = await bcrypt.hash(newPassword, 10);

        // Update password in DB
        await pool.execute(`UPDATE ${user_type} SET password = ? WHERE ${user_type}_id = ?`, [hash, user_id]);

        // Mark token as used
        await pool.execute("UPDATE token SET used = 1 WHERE token_id = ?", [tokenRow.token_id]);

        // Commit transaction
        await connection.commit();

        return res.status(200).json({ message: "Password has been reset successfully", status: "success" });
    } catch (err) {
        console.error(err);
        await connection.rollback();
        return res.status(500).json({ message: "Something went wrong!", status: "error" });
    } finally {
        connection.release();   // release connection back to pool
    }
};

export const changePassword = async (req, res) => {
    try {
        const { password0, password1 } = req.body;

        const user = req.user_id;
        const role = req.user_role;

        // Whitelist role
        const allowedTypes = ["student", "admin"];
        if (!allowedTypes.includes(role)) {
            return res.status(400).json({ message: "Invalid role", status: "error" });
        }

        //check if user exists
        const [rows] = await pool.execute(`SELECT password FROM ${role} WHERE ${role}_id = ?`, [user]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: "User not found" });
        }

        const oldPasswordHash = rows[0].password;

        // Compare old password
        const isUserValid = await bcrypt.compare(password0, oldPasswordHash);
        if (!isUserValid) {
            return res.status(409).json({ status: 'error', message: "Incorrect credentials" });
        }

        // hash the new password
        const newHash = await bcrypt.hash(password1, 10);

        // Update password
        await pool.execute(`UPDATE ${role} SET password = ? WHERE ${role}_id = ?`, [newHash, user]);

        return res.status(200).json({ status: 'success', message: "Password successfully updated" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong !", status: 'error' });
    }

}