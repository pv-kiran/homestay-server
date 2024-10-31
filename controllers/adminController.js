const Admin = require("../models/admin");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    }
});


const adminSignUp = async (req,res) => {
    const {name , email ,password} = req.body ;
    try {

        const admin = await Admin.find({email: email});
        if(admin.length >= 1){
           // return already registered message
        }

        const encPassword = await bcrypt.hash(password , 10);

        const otp = 1000 + Math.floor(Math.random() * 9000);
        const otpExpiry = Date.now() + 2*60*1000;
        
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
                    // res.redirect('/user/signin');
                    return res.json({
                        success: true,
                        message: "otp verified succussfully"
                    })
                } else {
                    return res.json({
                        success: true,
                        message: "OTP is already expired"
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
                message: "OTP is invalid"
            })
        }


    } catch(e) {
        console.log(e);
    }
    
}


const adminLogin = async (req, res) => {
    const { email, password } = req.body;

    try {

        const admin = await Admin.findOne({ email: email });

        if (admin) {

            let isCorrectPassword = await bcrypt.compare(password, admin.password);
            if (isCorrectPassword) {

                const token =  jwt.sign(
                
                    { userId: admin._id, email: email },
                    process.env.SECRET_KEY,
                    {
                        expiresIn: "2h"
                    }

                );

            admin.password = undefined;
            admin.token = token;

            
            const options = {
                expires: new Date(
                    Date.now() + 3*24*60*60*1000
                ) ,
                httpOnly: true
            }

            return res.status(200).cookie('token' , token , options).json({
                success: true ,
                user: admin
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