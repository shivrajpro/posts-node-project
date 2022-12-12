const bcrypt = require("bcryptjs");
const User = require("../models/user");
const validator = require("validator");

module.exports = {
  createUser: async function ({ userInput }, req) {
    // const email = args.userInput.email
    const errors = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "E-mail is invalid" });
    }

    if(validator.isEmpty(userInput.password) ||
        !validator.isLength({min:5})
    ){
        errors.push({message: "Password must contain atleast 5 characters"})
    }

    if(errors.length){
        const error = new Error('Invalid Input');
        throw error;
    }
    const existingUser = await User.findOne({ email: userInput.email });

    if (existingUser) {
      const error = new Error("User with this email already exists!");
      throw error;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      username: userInput.username,
      password: hashedPw,
    });

    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  }
};
