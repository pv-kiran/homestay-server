const generateContactUs = (name, email, subject, message) => {
    return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(to right, #30D5C8, #20B2AA);
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #ffffff;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 0 0 5px 5px;
    }
    .salutation {
      font-size: 18px;
      margin-bottom: 20px;
      color: #444444;
    }
    .intro {
      margin-bottom: 25px;
      color: #555555;
    }
    .field {
      margin-bottom: 20px;
      background-color: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
    }
    .label {
      font-weight: bold;
      color: #666666;
      margin-bottom: 5px;
    }
    .value {
      margin-top: 5px;
      color: #333333;
    }
    .footer {
      text-align: center;
      margin-top: 20px;
      color: #666666;
      font-size: 12px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }
    .signature {
      margin-top: 30px;
      color: #555555;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
    </div>
    <div class="content">
      <div class="salutation">Hello Admin,</div>
      <div class="intro">
        You have received a new contact form submission from your website. Here are the details:
      </div>
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${name}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${email}</div>
      </div>
      <div class="field">
        <div class="label">Subject:</div>
        <div class="value">${subject}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="value">${message}</div>
      </div>
      <div class="signature">
        Best regards,<br>
        BeStays IT Support
      </div>
    </div>
    <div class="footer">
      <p>This email was sent automatically from your website's contact form.</p>
      <p>© ${new Date().getFullYear()} Homestay. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`
};

module.exports = { generateContactUs };