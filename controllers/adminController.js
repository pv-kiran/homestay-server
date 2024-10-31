const Admin = require("../models/admin");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {transporter} = require('../utils/emailHelper');
const {validateAdminLogin, validateAdminSignup} = require('../utils/validationHelper');
const { getHashedPassword, verifyPassword } = require('../utils/passwordHelper');
const {generateOtp, getOtpExpiry} = require('../utils/otpHelper');
const {getToken, verifyToken} = require('../utils/jwtHelper');

const adminSignUp = async (req,res) => {
    try {
        const {error} = validateAdminSignup.validate(req.body);
        if(error) {
            return res.status(400).json({
                message: error.details[0]?.message
            })
        }
        const {name, email, password} = req.body ;
        const adminExists = await Admin.findOne({email: email});
        if(adminExists){
            return res.status(400).json({
                message: 'Email id already exists !'
            })
        }

        const encPassword = await getHashedPassword(password);
        const otp = generateOtp();
        const otpExpiry = getOtpExpiry();
        
        const newAdmin = await Admin.create({
            name: name ,
            email: email ,
            password: encPassword ,
            otp: otp ,
            otpExpiry: otpExpiry
        });

        // OTP Send
        const mailOptions = {
            from: 'admin@gmail.com',
            to: `${email}`,
            subject: 'OTP VERIFICATION',
            html: `<p>Enter <b> ${otp} </b> in the app to verify your email address and complete the signup process. This code expires in 2 minutes</p>`
        };

        await transporter.sendMail(mailOptions);
        
        return res.status(201).json({
            admin: newAdmin,
        });

    } catch(e) {
        console.log(e);
    }
    // res.redirect('/user/signin');
}


const adminOtpVerify = async (req,res) => {

    const {email , otp} = req.body ;
    try {
        const admin = await Admin.find({ email: email });
        
        if (parseInt(otp) === admin[0].otp) {
            
                if(Date.now() < admin[0].otpExpiry) {
                        await Admin.findOneAndUpdate({email:email} , { $set : {isVerified: true}});
                        admin[0].otp = undefined;
                        admin[0].otpExpiry = undefined;
                        await admin[0].save();
                    return res.json({
                        success: true,
                        message: "OTP verification successful"
                    })
                } else {
                    return res.json({
                        success: true,
                        message: "OTP already expired !"
                    })
                        // const isVerified = true ;
                        // const errorMessage = 'OTP is already expired'
                        // res.render('verifyotp' , {email: email , isVerified: isVerified , errMessage:errorMessage});
                }
        } else {
            // const isVerified = true ;
            // const errorMessage = 'OTP is invalid'
            // res.render('verifyotp', { email: email, isVerified: isVerified, errMessage: errorMessage });
            return res.json({
                success: true,
                message: "Invalid OTP !"
            })
        }
    } catch(e) {
        console.log(e);
    }
}


const adminLogin = async (req, res) => {
    
    try {

        const {error} = validateAdminLogin.validate(req.body);
        if(error) {
            return res.status(400).json({
                message: error.details[0]?.message
            })
        }

        const { email, password } = req.body;   
        const adminExists = await Admin.findOne({ email: email });

        if (adminExists) {
            const isCorrectPassword = await verifyPassword(password, adminExists.password);
            if (isCorrectPassword) {
                
                const token = await getToken(adminExists._id, email);

                adminExists.password = undefined;
                adminExists.token = token;

                const options = {
                    expires: new Date(
                        Date.now() + 3*24*60*60*1000
                    ) ,
                    httpOnly: true
                }

            return res.status(200).cookie('token' , token , options).json({
                success: true ,
                user: adminExists,
                message: 'Admin Login Successful'
            });
                
            } else {
                return res.status(400).json({
                    errorInfo : 'Incorrect password'
                })
            }
            
        } else {
            return res.status(404).json({
                errorInfo: `We didn't recoganize this email`
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            errorInfo :'Internal server error'
        })
    }

}

module.exports = {
    adminSignUp,
    adminOtpVerify,
    adminLogin
};