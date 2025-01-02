const generateBookingSuccessTemplate = (booking) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
            :root {
                --primary-color: #14b8a6;
                --primary-dark: #2fb3a5;
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
                padding: 20px;
                border-radius: 8px 8px 0 0;
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .booking-details {
                margin: 20px 0;
                border: 2px solid var(--primary-color);
                border-radius: 4px;
                padding: 20px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                border-bottom: 1px solid var(--border-color);
                padding-bottom: 10px;
            }
            .detail-label {
                color: var(--text-dark);
                font-weight: bold;
            }
            .footer {
                text-align: center;
                margin-top: 20px;
                color: var(--text-dark);
                font-size: 14px;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: var(--primary-color);
                color: var(--text-light);
                text-decoration: none;
                border-radius: 4px;
                margin-top: 20px;
                font-weight: bold;
                transition: background-color 0.3s ease;
            }
            .button:hover {
                background-color: var(--primary-dark);
            }
            .total {
                font-size: 20px;
                font-weight: bold;
                margin-top: 20px;
                text-align: right;
                color: var(--primary-color);
            }
        </style>
        </head>
        <body>
        <div class="container">
            <div class="header">
            <h1>Booking Confirmation</h1>
            </div>
            <div class="content">
            <p>Dear ${booking?.guestName},</p>
            <p>Thank you for choosing our hotel. Your booking has been confirmed successfully!</p>
            
            <div class="booking-details">
                <div class="detail-row">
                <span class="detail-label">Booking Reference:</span>
                <span>${booking?.bookingId}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Check-in Date:</span>
                <span>${booking?.checkIn}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Check-out Date:</span>
                <span>${booking?.checkOut}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Room Type:</span>
                <span>${booking?.roomType}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Number of Guests:</span>
                <span>${booking?.guests}</span>
                </div>
                <div class="total">
                Total Amount: $${booking?.totalAmount}
                </div>
            </div>

            <p>You can manage your booking by clicking the button below:</p>
            <center>
                <a href="${booking?.managementLink}" class="button">Manage Booking</a>
            </center>

            <p>If you have any questions or need to modify your reservation, please don't hesitate to contact us:</p>
            <p>📞 Phone: +1 (555) 123-4567<br>
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
    generateBookingSuccessTemplate,
}