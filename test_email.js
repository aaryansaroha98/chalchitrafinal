const db = require('./server/database');
const nodemailer = require('nodemailer');

// Test email configuration
async function testEmailConfig() {
  try {
    // Get mail settings from database
    const settings = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM mail_settings WHERE id = 1', (err, settings) => {
        if (err) reject(err);
        else resolve(settings);
      });
    });

    if (!settings) {
      console.log('No mail settings found in database');
      return;
    }

    console.log('Testing email configuration...');
    console.log('Host:', settings.email_host);
    console.log('Port:', settings.email_port);
    console.log('User:', settings.email_user);
    console.log('Sender:', settings.sender_name);
    console.log('Password set:', !!settings.email_pass);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: settings.email_host,
      port: settings.email_port,
      secure: settings.email_port === 465, // true for 465, false for other ports
      auth: {
        user: settings.email_user,
        pass: settings.email_pass
      }
    });

    // Test connection
    console.log('Testing transporter connection...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully');

    // Send test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${settings.sender_name}" <${settings.email_user}>`,
      to: settings.email_user, // Send to self for testing
      subject: 'Chalchitra - Mail Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px;">
            <h1 style="color: #28a745;">✓ Mail Configuration Successful!</h1>
            <p>This is a test email to confirm your mail settings are working correctly.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>SMTP Host:</strong> ${settings.email_host}</p>
              <p style="margin: 5px 0;"><strong>Port:</strong> ${settings.email_port}</p>
              <p style="margin: 5px 0;"><strong>Sender:</strong> ${settings.sender_name}</p>
            </div>
            <p style="color: #666;">If you received this email, your mail configuration is working correctly!</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);

  } catch (error) {
    console.error('❌ Email test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error response:', error.response);
    console.error('Full error:', error);
  }
}

testEmailConfig();