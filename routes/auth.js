const express = require("express");
// const User  = require('../models/')
const { body } = require("express-validator");
const User = require("../models/user");
const authController = require('../controllers/auth');
const router = express.Router();
const isAuth = require('../middleware/is-auth');

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
router.get('/status', isAuth, authController.getUserStatus);
router.patch('/status', isAuth, body('status').trim().notEmpty(),
authController.updateUserStatus);

module.exports = router;
