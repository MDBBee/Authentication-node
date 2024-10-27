const CustomError = require("../errors");
const { isTokenValid } = require("../utils");
const Token = require("../models/Token");
const { attachCookiesToResponse } = require("../utils");

const authenticateUser = async (req, res, next) => {
  const { accessToken, refreshToken } = req.signedCookies;

  let payload;

  try {
    if (accessToken) {
      payload = isTokenValid(accessToken);
      req.user = payload.user;
      return next();
    }

    payload = isTokenValid(refreshToken);
    const existingToken = await Token.findOne({
      refreshToken: payload.refreshToken.refreshToken,
      user: payload.user.userId,
    });
    if (!existingToken || !existingToken?.isValid)
      throw new CustomError.UnauthenticatedError(
        "Authentication Invalid from authenticate-user middleware!"
      );

    attachCookiesToResponse({
      res,
      user: payload.user,
      refreshToken: payload.refreshToken,
    });
    req.user = payload.user;
    return next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError(
      "Authentication Invalid from authenticate-user middleware!"
    );
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
