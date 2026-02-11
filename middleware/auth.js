import jwt from "jsonwebtoken";
import dotenv from 'dotenv'
dotenv.config();

const isLogIn = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "You must be logged in"
            });
        }

        const decoded = jwt.verify(token, process.env.SECRET);

        req.user = decoded;  // attach user to request

        next(); // move to next middleware / route

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};

export default isLogIn;
