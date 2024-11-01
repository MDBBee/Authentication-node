const jwt = require("jsonwebtoken");

const createJWT = ({ payload }) => jwt.sign(payload, process.env.JWT_SECRET);

const isTokenValid = (token) => jwt.verify(token, process.env.JWT_SECRET);

const attachCookiesToResponse = ({ res, user, refreshToken }) => {
  const acessTokenJwt = createJWT({ payload: { user } });
  const refreshTokenJwt = createJWT({ payload: { user, refreshToken } });

  const oneDay = 1000 * 60 * 60 * 24;
  const oneMonth = 1000 * 60 * 60 * 24 * 30;

  res.cookie("accessToken", acessTokenJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    signed: true,
    expires: new Date(Date.now() + oneDay),
  });

  res.cookie("refreshToken", refreshTokenJwt, {
    httpOnly: true,
    expires: new Date(Date.now() + oneMonth),
    secure: process.env.NODE_ENV === "production",
    signed: true,
  });
};
// const attachCookiesSingleCookieToResponse = ({ res, user }) => {
//   const token = createJWT({ payload: user });

//   const oneDay = 1000 * 60 * 60 * 24;

//   res.cookie("token", token, {
//     httpOnly: true,
//     expires: new Date(Date.now() + oneDay),
//     secure: process.env.NODE_ENV === "production",
//     signed: true,
//   });
// };

module.exports = {
  createJWT,
  isTokenValid,
  attachCookiesToResponse,
};
