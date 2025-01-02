const generateLocationRevealTemplate = (booking) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Hotel Location Revealed!</title>
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
                padding: 30px;
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
            .location-card {
                margin: 20px 0;
                border: 2px solid var(--primary-color);
                border-radius: 8px;
                padding: 25px;
                background: linear-gradient(145deg, white, var(--background-light));
            }
            .location-title {
                color: var(--primary-color);
                font-size: 24px;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .detail-row {
                margin: 15px 0;
                padding-bottom: 15px;
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
            .map-button {
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
            .map-button:hover {
                background-color: var(--primary-dark);
            }
            .important-note {
                margin-top: 20px;
                padding: 15px;
                background-color: rgba(64, 224, 208, 0.1);
                border-left: 4px solid var(--primary-color);
                border-radius: 4px;
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
            <h1>Your Hotel Location is Now Available!</h1>
            </div>
            <div class="content">
            <p>Dear ${booking?.guestName},</p>
            <p>Great news! As your check-in date approaches, we're excited to reveal the exact location of your hotel.</p>
            
            <div class="location-card">
                <div class="location-title">
                <span>📍</span> Hotel Location Details
                </div>
                <div class="detail-row">
                <span class="detail-label">Hotel Name</span>
                <span class="detail-value">${booking?.hotelName}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Address</span>
                <span class="detail-value">${booking?.address}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Landmarks</span>
                <span class="detail-value">${booking?.landmarks}</span>
                </div>
                <div class="detail-row">
                <span class="detail-label">Check-in Time</span>
                <span class="detail-value">${booking?.checkInTime}</span>
                </div>
                <center>
                <a href="${booking?.mapLink}" class="map-button">View map</a>
                </center>
            </div>

            <div class="important-note">
                <strong>Important:</strong>
                <ul>
                <li>Your check-in date is ${booking?.checkIn}</li>
                <li>Please have your booking ID (${booking?.bookingId}) and valid ID ready at check-in</li>
                <li>Contact our 24/7 support if you need directions or assistance</li>
                </ul>
            </div>

            <p>Need help getting there?</p>
            <p>📞 24/7 Support: +1 (555) 123-4567<br>
                📧 Email: support@yourhotel.com</p>
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
    generateLocationRevealTemplate,
}