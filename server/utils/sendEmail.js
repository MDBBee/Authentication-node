const nodemailer = require("nodemailer");
const nodeMConfig = require("../utils/nodemailerConfig");

const sendEmail = async ({ to, subject, html }) => {
  nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport(nodeMConfig);

  return transporter.sendMail({
    from: '"BCU.org" <bobbyugbebor@gmail.com>',
    to,
    subject,
    html,
  });
};

module.exports = sendEmail;
