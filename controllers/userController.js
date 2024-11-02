const User = require("../models/user");
const { generateOtpEmailTemplate } = require("../templates/otpEmailTemplate");
const { transporter } = require("../utils/emailHelper");
const { getToken } = require("../utils/jwtHelper");
const { getOtpExpiry, generateOtp } = require("../utils/otpHelper");
const { validateUserSignup, validateOtp } = require("../utils/validationHelper");

const userSignup = async (req, res) => {

    const {error} = validateUserSignup.validate(req.body);
    if(error) {
        return res.status(400).json({
            message: error.details[0]?.message
        })
    }
    const { email } = req.body ;
    try {
        let userExists = await User.findOne({ email: email });
        let otp = generateOtp();
        let otpExpiry = getOtpExpiry();
        if(userExists){
            userExists.otp = otp
            userExists.otpExpiry = otpExpiry
            await userExists.save();
        } else {
            userExists = await User.create({
                    email: email ,
                    otp: otp ,
                    otpExpiry: otpExpiry
            });
        }

        
        // OTP Send
        const mailOptions = {
            from: 'admin@gmail.com',
            to: `${email}`,
            subject: 'OTP VERIFICATION',
            html: generateOtpEmailTemplate("User", otp)
        };

        await transporter.sendMail(mailOptions);
        
        return res.status(200).json({
            success: true ,
            user: {
                _id: userExists.id,
                email: userExists.email
            },
            message: 'Please check your email for OTP verification.',
        });

    } catch (e) {
        console.log(e);
        if (e.name === 'ValidationError') {
            return res.status(400).json({ message: 'Invalid input data' });
        } else if (e.name === 'MongoError') {
            return res.status(500).json({ message: 'Database error occurred' });
        } else if (e.message.includes('getHashedPassword')) {
            return res.status(500).json({ message: 'Error in password hashing' });
        } else if (e.message.includes('sendMail')) {
            return res.status(500).json({ message: 'Error sending OTP email' });
        } else {
            console.error(e);
            return res.status(500).json({ message: 'An unexpected error occurred' });
        }
    }
}


const userOtpVerify = async (req,res) => {

    const { error } = validateOtp.validate(req.body);
        if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message 
        });
    }

    const {email, otp} = req.body ;
    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({
            success: false ,
            message: `user doesn't exists with this email`,
        });
        }
        
        if (parseInt(otp) === user.otp) {
            
                if(Date.now() < user.otpExpiry) {
                    await User.findOneAndUpdate({email:email} , { $set : {isVerified: true}});
                    user.otp = undefined;
                    user.otpExpiry = undefined;
                    await user.save();

                    const token = await getToken(user._id, email);
                    
                    return res.json({
                        success: true,
                        token,
                        message: "Signed In"
                    })
                } else {
                    return res.json({
                        success: false,
                        message: "OTP already expired !"
                    })
                }
        } else {
            return res.json({
                success: false,
                message: "Invalid OTP !"
            })
        }
    } catch(e) {
        console.log(e);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred"
        });
    }
}

module.exports = {
    userSignup,
    userOtpVerify
}