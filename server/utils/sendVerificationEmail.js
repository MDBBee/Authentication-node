const sendEmail = require("./sendEmail");

const sendVerificationEmail = async ({
  name,
  email,
  verificationToken,
  origin,
}) => {
  const verifyEmail = `${origin}/user/verify-email?token=${verificationToken}&email=${email}`;

  const message = `<p>Please confirm your email by clicking on the following link : <a href="${verifyEmail}">Please Click this link to verify your accout.</a></p>`;

  return sendEmail({
    to: email,
    subject: "Account Verification",
    html: `<h4> Hello, ${name} </h4>
    ${message}
    `,
  });
};

module.exports = sendVerificationEmail;
