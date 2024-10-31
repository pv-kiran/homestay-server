const Admin = require("../models/admin");
const {verifyToken} = require('../utils/jwtHelper');


const authenticateToken = (req,res,next) => {

    const authToken = req.headers['authorization']?.replace('Bearer ','') || req.cookies.token;

    if(!authToken) {
        return res.status(401).json({
            message: 'Access denied, token missing'
        })
    }
    try {
        const decoded = verifyToken(authToken);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid Token"
        })
    }
}

module.exports = {
    authenticateToken,
}