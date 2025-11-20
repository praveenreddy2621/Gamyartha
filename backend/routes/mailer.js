const nodemailer = require('nodemailer');
const { transporter, emailTemplates } = require('../utils/mailer');

async function sendEmail(type, data) {
    if (!emailTemplates[type]) {
        throw new Error(`Invalid email type: ${type}`);
    }
    const mailOptions = emailTemplates[type](data);
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${type} to ${data.to_email}`);
}

module.exports = { sendEmail };
