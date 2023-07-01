import express from "express";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import roomRoutes from "./routes/rooms.js";
import cookieParser from "cookie-parser"
import { db } from "./db.js";

const app = express()

app.use(express.json())
app.use(cookieParser())

//base template
// app.method('<path>', callBack function)

app.get("/test", (req,res) => {
    res.send("This is to authenticate user")
    
})

app.get('/getRandomID', (req,res) => {
    res.json("randomId")
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/rooms', roomRoutes)


app.listen(8800,()=> {
    console.log('Connected to backend')
})