const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  try {
    const hashedPw = await bcrypt.hash(password, 12);
    const user = new User({
      email: email,
      password: hashedPw,
      username: username,
    });

    const result = await user.save();
    res.status(201).json({ message: "User created", userId: result._id });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User does not exist with that email");
    error.statusCode = 422;
    throw error;
  }
  const isEqual = await bcrypt.compare(password, user.password);

  if (!isEqual) {
    const error = new Error("Wrong password!");
    error.statusCode = 422;
    throw error;
  }

  const token = jwt.sign(
    { email: user.email, userId: user._id.toString() },
    "somesupersecretsecret",
    { expiresIn: "1h" }
  );

  res.status(200).json({ token, userId: user._id.toString() });
};

exports.getUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ status: user.status });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  const newStatus = req.body.status;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    user.status = newStatus;
    const result = await user.save();
    res.status(200).json({ message: "Status updated!" });
  } catch (e) {
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  }
};
