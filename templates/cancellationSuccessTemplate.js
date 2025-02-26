const { formatDate } = require("../utils/formatDate");


const cancelationSuccessTemplate = (booking) => {
    return `
        <!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancellation Notice</title>
    <style>
        :root {
            --primary-color: #e63946;
            --primary-dark: #d62839;
            --text-dark: #1a1a1a;
            --text-light: #ffffff;
            --border-color: #e0e0e0;
            --background-light: #f8f8f8;
        }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: var(--background-light);
            color: var(--text-dark);
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: var(--primary-color);
            color: var(--text-light);
            text-align: center;
            padding: 25px;
            border-radius: 8px 8px 0 0;
            position: relative;
            overflow: hidden;
        }
        .header::after {
            content: '';
            font-size: 80px;
            position: absolute;
            right: -20px;
            top: -20px;
            opacity: 0.2;
        }
        .content {
            background-color: white;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .card {
            margin: 20px 0;
            border: 2px solid var(--primary-color);
            border-radius: 8px;
            padding: 20px;
            background: linear-gradient(145deg, white, var(--background-light));
        }
        .card-title {
            color: var(--primary-color);
            font-size: 20px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .detail-row {
            margin: 12px 0;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--border-color);
        }
        .detail-label {
            color: var(--text-dark);
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .detail-value {
            color: var(--primary-dark);
            font-size: 16px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: var(--text-dark);
            font-size: 14px;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1>Booking Cancellation Notice</h1>
        </div>
        <div class="content">
            <p>Dear ${booking?.userId?.fullName},</p>
            <p>We regret to inform you that your booking has been cancelled as per your request. Below are the details of your cancelled booking:</p>
            
            <div class="card">
                <div class="card-title">
                    <span>❌</span> Cancellation Details
                </div>
                <div class="detail-row">
                    <span class="detail-label">Booking Reference</span>
                    <span class="detail-value">${booking?._id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Homestay Name</span>
                    <span class="detail-value">${booking?.homestayId?.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Check-in Date</span>
                    <span class="detail-value">${formatDate(booking?.checkIn)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Check-out Date</span>
                    <span class="detail-value">${formatDate(booking?.checkOut)}</span>
                </div>
                <div class="total">
                    Refunded Amount: ${booking?.amount}
                </div>
                <div class="total">
                    Refunded Id: ${booking?.refundId}
                </div>
                <div class="total">
                    Refunded At: ${formatDate(booking?.refundedAt)}
                </div>
            </div>
            
            <p>If this cancellation was made in error, or if you need further assistance, please contact our support team.</p>
            
            <p>📞 24/7 Support: +1 (555) 123-4567<br>
               📧 Email: support@bestays.com</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
            <p>© 2025 BeStays. All rights reserved.</p>
        </div>
    </div>
    </body>
    </html>
    `;
};

module.exports = {
    cancelationSuccessTemplate,
}