const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerifyEmail = async (email, username, activationToken) => {
  let info = await transporter.sendMail({
    from: '"Generic Webstore" <webstore@noreply.com> ',
    to: email,
    subject: "Verify Webshop account",
    text: `Hello, ${username}! \n\n 
    Normally you'd recieve an email with a link, that points to the front-end, 
    containing the activation token as an URL parameter. After clicking the link, 
    the front-end would send a POST request containing this token to the back-end.
    Because this is a purely back-end project, you'll have to do send that request manually. \n\n 
    Anyways, here's your token: ${activationToken}`,
  });
  console.log(info);
};

const sendRecoveryEmail = async (email, username, recoveryToken) => {
  let info = await transporter.sendMail({
    from: '"Generic Webstore" <webstore@noreply.com> ',
    to: email,
    subject: "Recover Webshop account",
    text: `Hello, ${username}! \n\n 
    Normally you'd recieve an email with a link, that points to the front-end, 
    containing the recovery token as an URL parameter. After clicking the link, 
    the front-end would send a POST request containing this token to the back-end,
    to validate it. If this token is valid, you'd be able to fill out a form to set your
    new password. Because this is a purely back-end project, you'll have to do send that 
    request manually. \n\n 
    Anyways, here's your token: ${recoveryToken}`,
  });
  console.log(info);
};

module.exports = { sendVerifyEmail, sendRecoveryEmail };
