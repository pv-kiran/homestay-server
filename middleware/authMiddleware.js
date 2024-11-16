const Admin = require("../models/admin");
const User = require("../models/user");
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


const isAdmin = async(req, res, next) => {
    try {
        const admin = await Admin.findById({_id:req.userId});
        if(admin?.role === 'admin') {
            next();
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Unauthorized access'
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server error"
        })
    }
}

const isUser = async(req, res, next) => {
    try {
        const user = await User.findById({_id:req.userId});
        if(!user?.isDisabled) {
            next();
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Your account has been temporarily suspended! Please contact admin'
            })
        }
    } catch (error) {
        return res.status(500).json({
            message: "Internal Server error"
        })
    }
}

module.exports = {
    authenticateToken,
    isAdmin,
    isUser,
}