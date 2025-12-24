import jwt from "jsonwebtoken";
import cookie from "cookie"; // npm install cookie

export const authMiddleware = async (req, res, next) => {
    const PRIVATE_KEY = "jwtkey";

    try {
        let token;

        // 1. Try Authorization header first
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }
        // 2. Fallback to cookies
        else if (req.headers.cookie) {
            const cookies = cookie.parse(req.headers.cookie);
            token = cookies.access_token; // assuming you set cookie name as "access_token"
        }

        if (!token) {
            return res.status(401).json({ message: "Unauthorized User" });
        }
        // Verify token
        const user = jwt.verify(token, PRIVATE_KEY);
        req.user_id = user.id;
        req.user_role = user.role;

        return next();

    } catch (err) {
        console.log(err)
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired, please log in again" });
        }
        return res.status(401).json({ message: "Invalid token" });
    }
}