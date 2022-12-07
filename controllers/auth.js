const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const jwt = require('jsonwebtoken');

exports.signup = (req, res, next) => {
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

  bcrypt
    .hash(password, 12)
    .then((hashedPw) => {
      const user = new User({
        email: email,
        password: hashedPw,
        username: username,
      });

      return user.save();
    })
    .then((result) => {
      res.status(201).json({ message: "User created", userId: result._id });
    })
    .catch((e) => {
      console.log(e);
      if (!e.statusCode) e.statusCode = 500;
      next(e);
    });
};

exports.login = (req, res, next)=>{
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;

  User.findOne({email})
  .then(user=>{
    if(!user){
      const error = new Error("User does not exist with that email");
      error.statusCode = 422;
      throw error;
    }

    loadedUser = user;

    return bcrypt.compare(password, user.password);
  })
  .then(isEqual=>{
    if(!isEqual){
      const error = new Error("Wrong password!");
      error.statusCode = 422;
      throw error;
    }

    const token = jwt.sign(
      { email: loadedUser.email, 
        userId: loadedUser._id.toString() 
      },
      'somesupersecretsecret',
      {expiresIn:'1h'}
      )
    
      res.status(200).json({token, userId: loadedUser._id.toString()});
  })
  .catch(e=>{
    // console.log(e);
    next(e)
  })
}


exports.getUserStatus = (req, res, next)=>{
  User.findById(req.userId)
  .then(user=>{
    if(!user){
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({status:user.status})

  })
  .catch(e=>{
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  })
}

exports.updateUserStatus = (req, res, next)=>{
  const newStatus = req.body.status;

  User.findById(req.userId)
  .then(user=>{
    if(!user){
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    user.status = newStatus;
    return user.save();
    
  })
  .then(result=>{
    res.status(200).json({message:"Status updated!"})
  })
  .catch(e=>{
    if (!e.statusCode) e.statusCode = 500;
    next(e);
  })  
}