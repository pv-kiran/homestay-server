const generateOtpEmailTemplate = (name, otp) => {
    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2c3e50;">Welcome to BeStays!</h2>
            <p>Dear ${name},</p>
            
            <p>We received a request to create an account using this email address. To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
            
            <div style="padding: 10px; border: 1px solid #ddd; display: inline-block; margin: 15px 0;">
                <h3 style="color: #2c3e50; margin: 0;">${otp}</h3>
            </div>
            
            <p><strong>Note:</strong> This OTP is valid for <strong>2 minutes</strong> from the time you received this email.</p>
            
            <p>If you did not request this code, please ignore this email or contact our support team if you have any concerns.</p>
            <br>
            <p>Thank you for choosing us!</p>
            <br>
            <p>Best Regards,<br>BeStays</p>
            
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #777;">If you have any issues, please contact support at <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.</p>
        </div>
    `;
};


const generateAdminOtpEmailTemplate = (email, otp) => {
    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2c3e50;">New Admin Signup Verification</h2>
            <p>Dear Kalesh Nair,</p>
            
            <p>An account setup request was initiated by <strong>${email}</strong> to gain admin access on BeStays. To authorize this request, please use the One-Time Password (OTP) provided below:</p>
            
            <div style="padding: 10px; border: 1px solid #ddd; display: inline-block; margin: 15px 0;">
                <h3 style="color: #2c3e50; margin: 0;">${otp}</h3>
            </div>
            
            <p><strong>Note:</strong> This OTP is valid for <strong>2 minutes</strong> from the time you received this email. Please share it only with authorized personnel as necessary to complete the signup process.</p>
            
            <p>If you did not initiate this request or have any concerns regarding the security of this action, please contact our support team immediately.</p>
            <br>
            <p>Best Regards,<br>BeStays Security Team</p>
            
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #777;">If you need assistance, please contact support at <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.</p>
        </div>
    `;
};

module.exports = {
    generateOtpEmailTemplate,
    generateAdminOtpEmailTemplate
};
