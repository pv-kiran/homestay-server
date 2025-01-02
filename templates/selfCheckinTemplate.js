const generateSelfCheckinTemplate = (booking) => {
    return `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Check-in Window is Now Open!</title>
        <style>
            :root {
                --primary-color: #14b8a6;
                --primary-dark: #2fb3a5;
                --text-dark: #1a1a1a;
                --text-light: #ffffff;
                --border-color: #e0e0e0;
                --background-light: #f8f8f8;
                --success-color: #4CAF50;
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
            }
            .content {
                background-color: white;
                padding: 30px;
                border-radius: 0 0 8px 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .checkin-card {
                margin: 20px 0;
                border: 2px solid var(--success-color);
                border-radius: 8px;
                padding: 25px;
                background-color: #f9fff9;
            }
            .timer {
                text-align: center;
                font-size: 24px;
                color: var(--success-color);
                margin: 15px 0;
                font-weight: bold;
            }
            .button {
                display: inline-block;
                padding: 12px 24px;
                background-color: var(--primary-color);
                color: var(--text-light);
                text-decoration: none;
                border-radius: 4px;
                margin: 10px 0;
                font-weight: bold;
                transition: background-color 0.3s ease;
            }
            .button:hover {
                background-color: var(--primary-dark);
            }
            .steps {
                margin: 20px 0;
                padding: 20px;
                background-color: var(--background-light);
                border-radius: 8px;
            }
            .step {
                margin: 15px 0;
                padding-left: 30px;
                position: relative;
            }
            .step:before {
                content: '✓';
                position: absolute;
                left: 0;
                color: var(--success-color);
                font-weight: bold;
            }
            .location-summary {
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
            <h1>🎉 Your Check-in Window is Now Open!</h1>
            </div>
            <div class="content">
            <p>Dear ${booking?.guestName},</p>
            <p>Your self check-in window is now open for your stay at ${booking?.hotelName}!</p>
            
            <div class="checkin-card">
                <div class="timer">
                Check-in closes in: 1 hour
                </div>
                <center>
                <a href="${booking?.checkInLink}" class="button">Start Self Check-in</a>
                </center>
            </div>

            <div class="steps">
                <h3>Check-in Instructions:</h3>
                <div class="step">Click the "Start Self Check-in" button above</div>
                <div class="step">Present your ID and reservation during offline confirmation of check-in</div>
                <div class="step">If you require any assistance with your luggage, feel free to ask our staff, and they will be happy to assist.</div>
            </div>

            <div class="location-summary">
                <h3>📍 Hotel Location</h3>
                <p><strong>Address:</strong> ${booking?.address}</p>
                <p><strong>Landmarks:</strong> ${booking?.landmarks}</p>
                <center>
                <a href="${booking?.mapLink}" class="button">View map</a>
                </center>
            </div>

            <p><strong>Need assistance?</strong></p>
            <p>Our 24/7 support team is ready to help:</p>
            <p>📞 Phone: +1 (555) 123-4567<br>
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
    generateSelfCheckinTemplate,
}