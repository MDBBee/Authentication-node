const User = require("../models/User");
const Token = require("../models/Token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
  sendResetPasswordEmail,
  createHash,
} = require("../utils");
const crypto = require("crypto");
const { log } = require("console");

const register = async (req, res) => {
  const { email, name, password } = req.body;

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  // first registered user is an admin
  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const verificationToken = crypto.randomBytes(40).toString("hex");

  const user = await User.create({
    name,
    email,
    password,
    role,
    verificationToken,
  });

  const origin = "http://localhost:3000";
  await sendVerificationEmail({
    name: user.name,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Success!! Please check your email to verify your account!!",
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken, email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    throw new CustomError.UnauthenticatedError("Verification Failed!!");

  if (verificationToken !== user.verificationToken)
    throw new CustomError.UnauthenticatedError("Verification Failed!!!!");

  user.isVerified = true;
  user.verified = Date.now();
  user.verificationToken = "";

  await user.save();

  res.status(StatusCodes.CREATED).json({
    msg: "Verification successful!!",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }
  if (!user.isVerified)
    throw new CustomError.UnauthenticatedError(
      "Please complete your verification by checking your email!"
    );

  const accessToken = createTokenUser(user);

  //create refresh token
  let refreshToken = "";
  //check for existing token
  const refreshTokenExists = await Token.findOne({ user: user._id });

  if (refreshTokenExists) {
    const { isValid } = refreshTokenExists;
    if (!isValid)
      throw new CustomError.UnauthenticatedError(
        "Access denied, invalid credentials!!.."
      );
    refreshToken = refreshTokenExists;
    attachCookiesToResponse({ res, user: accessToken, refreshToken });
    res.status(StatusCodes.OK).json({ user: accessToken });
    return;
  }

  refreshToken = crypto.randomBytes(40).toString("hex");
  const userAgent = req.headers["user-agent"];
  const ip = req.ip;
  const userToken = { refreshToken, ip, userAgent, user: user._id };

  //1)Sending/saving refreshToken and req info to the backend-- database
  await Token.create(userToken);
  //2)Sending cookies(refresh and access tokens) to the frontend-- browserCookies
  //Note: accessToken = {name: user.name, userId: user._id, role: user.role}
  //Note: refreshToken = randomnuber674374787847843hehuerhjrehjeh
  attachCookiesToResponse({ res, user: accessToken, refreshToken });
  res.status(StatusCodes.OK).json({ user: accessToken });
};

const logout = async (req, res) => {
  await Token.findOneAndDelete({ user: req.user.userId });

  res.cookie("accessToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.cookie("refreshToken", "logout", {
    httpOnly: true,
    expires: new Date(Date.now()),
  });

  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (user) {
    const forgotPasswordToken = crypto.randomBytes(70).toString("hex");
    const tenMinutes = 1000 * 60 * 10;
    const forgotPasswordExpirationTime = new Date(Date.now() + tenMinutes);
    console.log(createHash(forgotPasswordToken));

    user.passwordToken = createHash(forgotPasswordToken);
    user.passwordTokenExpirationDate = forgotPasswordExpirationTime;

    await user.save();
    //Send Email
    const origin = "http://localhost:3000";
    await sendResetPasswordEmail({
      name: user.name,
      email: user.email,
      origin,
      passwordToken: forgotPasswordToken,
    });
  }

  res.status(StatusCodes.OK).json({ msg: "Please Check your email...!" });
};

const resetPassword = async (req, res) => {
  const { email, token, password } = req.body;

  if (!email || !token || !password) {
    throw new CustomError.BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (user) {
    const currentTime = new Date();
    console.log("toke*******", createHash(token));

    if (
      user.passwordToken === createHash(token) &&
      currentTime < user.passwordTokenExpirationDate
    ) {
      user.password = password;
      user.passwordToken = null;
      user.passwordTokenExpirationDate = null;

      await user.save();
    }

    res.send("reset password");
  }
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
