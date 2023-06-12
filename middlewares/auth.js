import jwt from "jsonwebtoken"


export const authMiddleware = async(req, res, next) => {
    const PRIVATE_KEY = "jwtkey"

    try {
        let token = req.headers.cookie
        if(token) {
            token = req.headers.cookie.split('=')[1]
            let user = jwt.verify(token, PRIVATE_KEY)
            req.userID = user.id
        }
        else {
            res.status(401).json("Unauthorized User")
        }

        next()

    } catch (error) {
        console.log(error)
        res.status(401).json("Unauthorized User")
    }
}