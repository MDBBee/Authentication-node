const User = require("../models/User");
const Token = require("../models/Token");
const { StatusCodes } = require("http-status-codes");
const CustomError = require("../errors");
const {
  attachCookiesToResponse,
  createTokenUser,
  sendVerificationEmail,
} = require("../utils");
const crypto = require("crypto");

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
  console.log("***", refreshToken);

  //1)Sending/saving refreshToken and req info to the backend-- database
  await Token.create(userToken);
  //2)Sending cookies(refresh and access tokens) to the frontend-- browserCookies
  //Note: accessToken = {name: user.name, userId: user._id, role: user.role}
  //Note: refreshToken = randomnuber674374787847843hehuerhjrehjeh
  attachCookiesToResponse({ res, user: accessToken, refreshToken });
  res.status(StatusCodes.OK).json({ user: accessToken });
};

const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true,
    expires: new Date(Date.now() + 1000),
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out!" });
};

module.exports = {
  register,
  login,
  logout,
  verifyEmail,
};
