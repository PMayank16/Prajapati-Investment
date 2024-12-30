// pages/api/send-email.js

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { clientIds, userEmail, userPassword } = req.body;

  if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
    return res.status(400).json({ error: 'No clients provided.' });
  }

  if (!userEmail || !userPassword) {
    return res.status(400).json({ error: 'Email credentials are required.' });
  }

  try {
    // Configure the transporter with the provided user credentials
    // In a real scenario, you might store these credentials securely and not ask the user each time.
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: userEmail,      // The user's email address
        pass: userPassword,   // The user's email password or App Password
      },
    });

    // For demonstration, send a simple email
    // In practice, you'd look up the clients' emails from the database or context
    // and send each one an email, or send a single email to multiple recipients.
    // Here we just send one email to yourself as a test.
    const mailOptions = {
      from: userEmail,
      to: userEmail,  // Replace this with actual client emails if you have them
      subject: 'Notification Reminder',
      text: `This is a test notification for client IDs: ${clientIds.join(', ')}.`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Emails sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
}
