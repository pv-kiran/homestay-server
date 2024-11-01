const Admin = require("../models/admin");
const Category = require('../models/category');
const {transporter} = require('../utils/emailHelper');
const {validateAdminLogin, validateAdminSignup, validateOtp, validateCategory} = require('../utils/validationHelper');
const { getHashedPassword, verifyPassword } = require('../utils/passwordHelper');
const {generateOtp, getOtpExpiry} = require('../utils/otpHelper');
const {getToken} = require('../utils/jwtHelper');
const {generateOtpEmailTemplate} = require('../templates/otpEmailTemplate');
const {cloudinary} = require('../utils/cloudinaryHelper');
const upload = require('../utils/multerHelper');

//ADMIN SIGNUP
const adminSignUp = async (req,res) => {

    const {error} = validateAdminSignup.validate(req.body);
    if(error) {
        return res.status(400).json({
            message: error.details[0]?.message
        })
    }
    const {name, email, password} = req.body ;
    try {
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
            html: generateOtpEmailTemplate(name, otp)
        };

        await transporter.sendMail(mailOptions);
        
        return res.status(201).json({
            success: true ,
            admin: {
                _id: newAdmin._id,
                email: newAdmin.email
            },
            message: 'Signup successful! Please check your email for OTP verification.',
        });

    } catch(e) {
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

//ADMIN OTP VERIFICATION
const adminOtpVerify = async (req,res) => {

    const { error } = validateOtp.validate(req.body);
        if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message 
        });
    }

    const {email, otp} = req.body ;
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
                }
        } else {
            return res.json({
                success: true,
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

//ADMIN LOGIN
const adminLogin = async (req, res) => {
    
    const {error} = validateAdminLogin.validate(req.body);
    if(error) {
        return res.status(400).json({
            message: error.details[0]?.message
        })
    }

    const { email, password } = req.body;   

    try {
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
                admin: {
                    _id: adminExists._id,
                    email: adminExists.email,
                    token: token
                },
                message: 'Admin Login Successful'
            });
                
            } else {
                return res.status(400).json({
                    errorInfo : 'Incorrect password'
                })
            }
            
        } else {
            return res.status(404).json({
                errorInfo: `We didn't recognize this email`
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({
            errorInfo :'Internal server error'
        })
    }

}

//ADMIN CATEGORY MANAGEMENT - ADD
const addCategory = async (req, res) => {
    upload.single('iconUrl')(req, res, async (error) => { 
        if (error) {
            return res.status(500).json({
                message: 'Icon upload error'
            });
        }
        try {
            const { error } = validateCategory.validate(req.body);
            if (error) {
              return res.status(400).json({ message: error.details[0].message });
            }
            const existingCategory = await Category.findOne({ categoryName: req.body.categoryName, isDisabled: false });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }

            let iconUrl = '';
            if (req.file) {
                const icon = await cloudinary.uploader.upload(req.file.path);
                iconUrl = icon.secure_url;
            }

            const newCategory = new Category({
                categoryName: req.body.categoryName,
                iconUrl: iconUrl,
            });

            await newCategory.save();
            res.status(201).json({
                success: true,
                message: 'Category created successfully',
                category: newCategory
            });
        } catch (error) {
            return res.status(500).json({
                message: 'Internal server error'
            });
        }
    });
};


//ADMIN CATEGORY MANAGEMENT - UPDATE
const updateCategory = async (req, res) => {
    upload.single('iconUrl')(req, res, async (uploadError) => {
        if (uploadError) {
          return res.status(500).json({ message: 'Icon upload error' });
        }
    
        try {
          const { error } = validateCategory.validate(req.body);
          if (error) {
            return res.status(400).json({ message: error.details[0].message });
          }
    
          const { categoryId } = req.params;
    
          // Check if a category with the same name exists (excluding the current category)
          const existingCategory = await Category.findOne({
            categoryName: req.body.categoryName,
            _id: { $ne: categoryId },
            isDisabled: false,
          });
          if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
          }
    
          // Handle icon upload if a new file is provided
          let iconUrl = req.body.iconUrl; // default to existing iconUrl
          if (req.file) {
            try {
              const result = await cloudinary.uploader.upload(req.file.path);
              iconUrl = result.secure_url;
            } catch (cloudinaryError) {
              return res.status(500).json({ message: 'Error in uploading icon to Cloudinary' });
            }
          }
          // Update the category
          const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            { categoryName: req.body.categoryName, iconUrl: iconUrl },
            { new: true }
          );
    
          if (!updatedCategory) {
            return res.status(404).json({ message: 'Category not found' });
          }
    
          res.status(200).json({
            success:true,
            message: 'Category updated successfully',
            category: updatedCategory,
          });
        } catch (error) {
          res.status(500).json({ message: 'Internal server error' });
        }
    });
};


//ADMIN CATEGORY MANAGEMENT - DISABLE
const disableCategory = async (req, res) => {
    try {
        const {categoryId} = req.params;
        const disabledCategory = await Category.findByIdAndUpdate(
            categoryId,
            { isDisabled: true },
            { new: true }
        );

        if(!disabledCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ 
            success: true,
            message: 'Category disabled successfully', 
            category: disabledCategory 
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    adminSignUp,
    adminOtpVerify,
    adminLogin,
    addCategory,
    updateCategory,
    disableCategory,
}