const generateOtpEmailTemplate = (name, otp) => {
    return `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #2c3e50;">Welcome to Our Service!</h2>
            <p>Dear ${name},</p>
            
            <p>We received a request to create an account using this email address. To complete your registration, please use the following One-Time Password (OTP) to verify your email address:</p>
            
            <div style="padding: 10px; border: 1px solid #ddd; display: inline-block; margin: 15px 0;">
                <h3 style="color: #2c3e50; margin: 0;">${otp}</h3>
            </div>
            
            <p><strong>Note:</strong> This OTP is valid for <strong>2 minutes</strong> from the time you received this email.</p>
            
            <p>If you did not request this code, please ignore this email or contact our support team if you have any concerns.</p>
            
            <p>Thank you for choosing us!</p>
            <p>Best Regards,<br>BeStays</p>
            
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #777;">If you have any issues, please contact support at <a href="mailto:support@yourcompany.com">support@yourcompany.com</a>.</p>
        </div>
    `;
};

module.exports = {
    generateOtpEmailTemplate,
};
