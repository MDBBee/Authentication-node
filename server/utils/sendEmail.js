const nodemailer = require("nodemailer");
const nodeMConfig = require("../utils/nodemailerConfig");

const sendEmail = async ({ to, subject, html }) => {
  let testAccount = nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(nodeMConfig);
  return transporter.sendMail({
    from: '"BCU.org" <bobbyugbebor@gmail.com>', // sender address
    // to: "user@user.com", // list of receivers
    // subject: "Account Verification ✔", // Subject line
    // text: "Please verify your account!! ✔", // plain text body
    // html: "<b>Hello world?</b>", // html body
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
