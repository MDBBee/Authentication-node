const sendEmail = require("./sendEmail");

const sendResetPasswordEmail = async ({
  name,
  email,
  origin,
  passwordToken,
}) => {
  const url = `${origin}/user/reset-password?token=${passwordToken}&email=${email}`;
  const message = `Please click the "Reset Password Link" in other to reset your password.. <a href="${url}">Reset password</a>`;

  return sendEmail({
    to: email,
    subject: "Reset Password",
    html: `<h4>Hello, ${name}......</h4>
    ${message}`,
  });
};

module.exports = sendResetPasswordEmail;
