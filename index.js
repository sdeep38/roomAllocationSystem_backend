import express from "express";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import cookieParser from "cookie-parser"
import { db } from "./db.js";

const app = express()

app.use(express.json())
app.use(cookieParser())

//base template
// app.method('<path>', callBack function)

app.get("/test", (req,res) => {
    res.json("This is to authenticate user")
    
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)

//testing 
// app.get('/insert', (req,res) => {
//     const sqlQr = "INSERT INTO admin (name, phone, position, password, email) VALUES (?)"

//     const values = [
//         ['admin1', '9856554751', 'gSec', 'admin', 'admin11@gmail.com'],
//         ['admin2', '9856554751', 'hallPresident', 'admin', 'admin22@gmail.com'],
//         ['admin3', '9856554751', 'Warden', 'admin', 'admin33@gmail.com'],
//     ]
//     db.query(sqlQr, [values], (err,data) => {
//         console.log("error", err)
//         res.send("Data inserted")
//     })
// })

app.listen(8800,()=> {
    console.log('Connected to backend')
})