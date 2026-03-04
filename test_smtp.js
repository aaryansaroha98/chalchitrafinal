const nodemailer = require('nodemailer');

async function test() {
  const user = 'chalchitra@iitjammu.ac.in';
  const pass = 'qnqm mcms cidd vmti';
  
  console.log('Testing SMTP with service:gmail...');
  console.log('User:', user);
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    logger: true,
    debug: true,
    tls: { rejectUnauthorized: false }
  });

  try {
    const verified = await transporter.verify();
    console.log('SMTP verify:', verified);
    
    const result = await transporter.sendMail({
      from: '"Chalchitra Test" <' + user + '>',
      to: user,
      subject: 'Test Email - ' + new Date().toISOString(),
      text: 'This is a test email sent at ' + new Date().toISOString(),
      html: '<h2>Test Email</h2><p>Sent at ' + new Date().toISOString() + '</p>'
    });
    console.log('Email sent! MessageId:', result.messageId);
    console.log('Response:', result.response);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('Command:', err.command);
  }
  process.exit(0);
}
test();
