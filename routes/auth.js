const express = require("express");
// const User  = require('../models/')
const { body } = require("express-validator");
const User = require("../models/user");
const authController = require('../controllers/auth');
const router = express.Router();

router.put("/signup", [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .custom((value, { req }) => {
      return User.findOne({ email: value }).then((userDoc) => {
        if (userDoc) return Promise.reject("E-mail alread exists, try login");
      });
    })
    .normalizeEmail(),
  body("password").trim().isLength({ min: 5 }),
  body("username").trim().notEmpty(),
],
    authController.signup
);

router.post('/login', authController.login);
module.exports = router;
