const { formatDate } = require("../utils/formatDate");

const createGoogleMapsLink = (latitude, longitude) => {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        latitude = Number(latitude);
        longitude = Number(longitude);

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new Error('Latitude and longitude must be valid numbers');
        }
    }
    // Construct the Google Maps URL with the coordinates
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

const generateBookingSuccessTemplate = (booking, currency) => {
    return `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Confirmation & Location Details</title>
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
        padding: 25px;
        border-radius: 8px 8px 0 0;
        position: relative;
        overflow: hidden;
    }
    .header::after {
        content: '📍';
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
    .button {
        display: inline-block;
        padding: 12px 24px;
        background-color: var(--primary-color);
        color: var(--text-light);
        text-decoration: none;
        border-radius: 4px;
        margin-top: 15px;
        font-weight: bold;
        transition: background-color 0.3s ease;
        text-align: center;
    }
    .button:hover {
        background-color: var(--primary-dark);
    }
    .important-note {
        margin-top: 20px;
        padding: 15px;
        background-color: rgba(64, 224, 208, 0.1);
        border-left: 4px solid var(--primary-color);
        border-radius: 4px;
    }
    .total {
        font-size: 20px;
        font-weight: bold;
        margin-top: 15px;
        text-align: right;
        color: var(--primary-color);
    }
    .footer {
        text-align: center;
        margin-top: 20px;
        color: var(--text-dark);
        font-size: 14px;
    }
    .button-container {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
    @media (max-width: 480px) {
        .button-container {
            flex-direction: column;
            gap: 10px;
        }
        .button {
            width: 100%;
        }
    }
    </style>
    </head >
    <body>
        <div class="container">
            <div class="header">
                <h1>Booking Confirmation & Location Details</h1>
            </div>
            <div class="content">
                <p>Dear ${booking?.userId?.fullName},</p>
                <p>Thank you for choosing BeStays! Your booking has been confirmed successfully, and we're excited to share your homestay details.</p>

                <div class="card">
                    <div class="card-title">
                        <span>🏠</span> Booking Details
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Booking Reference</span>
                        <span class="detail-value">${booking?._id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Check-in Date</span>
                        <span class="detail-value">${formatDate(booking?.checkIn)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Check-out Date</span>
                        <span class="detail-value">${formatDate(booking?.checkOut)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Number of Guests</span>
                        <span class="detail-value">${booking?.guests}</span>
                    </div>
                    <div class="total">
                        Total Amount: 
                        <span>
                        ${currency?.symbol} 
                        </span>
                        <span>
                        ${booking?.amount} 
                        </span>
                    </div>
                </div>

                <div class="card">
                    <div class="card-title">
                        <span>📍</span> Homestay Location Details
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Homestay Name</span>
                        <span class="detail-value">${booking?.homestayId?.title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address</span>
                        <span class="detail-value">
                            ${booking?.homestayId?.address?.street},
                            ${booking?.homestayId?.address?.city},
                            ${booking?.homestayId?.address?.district},
                            ${booking?.homestayId?.address?.state}
                        </span>
                    </div>
                </div>

                <div class="button-container">
                    <a href="http://localhost:5173/mybookings" class="button">Manage Booking</a>
                    <a href="${createGoogleMapsLink(booking?.homestayId?.address?.coordinates?.latitude, booking?.homestayId?.address?.coordinates?.longitude)}" class="button">View Location</a>
                </div>

                <div class="important-note">
                    <strong>Important:</strong>
                    <ul>
                        <li>Please have your booking ID and valid ID ready at check-in</li>
                        <li>Contact our support team if you need directions or assistance</li>
                    </ul>
                </div>

                <p>Need help or have questions?</p>
                <p>📞 24/7 Support: +1 (555) 123-4567<br>
                    📧 Email: support@bestays.com</p>
            </div>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>© 2025 BeStays. All rights reserved.</p>
            </div>
        </div>
        </body>
    </html >`;
};

module.exports = {
    generateBookingSuccessTemplate,
}