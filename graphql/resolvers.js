const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Post = require("../models/post");
const validator = require("validator");
const jwt = require('jsonwebtoken');
const { clearImage } = require('../util/file');

module.exports = {
  createUser: async function ({ userInput }, req) {
    // const email = args.userInput.email
    const errors = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "E-mail is invalid" });
    }

    if(validator.isEmpty(userInput.password) ||
        !validator.isLength(userInput.password, {min:5})
    ){
        errors.push({message: "Password must contain atleast 5 characters"})
    }

    if(errors.length){
        const error = new Error('Invalid Input');
        error.data = errors;
        error.code = 422;
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
  },

  login: async function({email, password}){
    const user  = await User.findOne({email});

    if(!user){
      const error = new Error("User not found");
      error.code = 401;
      throw error;
    }
    
    const isEqual = await bcrypt.compare(password, user.password);
    if(!isEqual){
      const error = new Error("Incorrect Password");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign({
      userId:user._id.toString(),
      email: user.email
    }, 'somesupersecretsecret', {expiresIn:'1h'})
  
  
    return {token:token, userId:user._id.toString()}
  },

  createPost: async function ({postInput}, req) {
    checkAuth(req.isAuth);

    const user = await User.findById(req.userId);
    
    if(!user){
      const error = new Error("Invalid user");
      error.code = 401;
      throw error;
    }

    const errors = [];

    if(validator.isEmpty(postInput.title) ||
        !validator.isLength(postInput.title, {min:5})
    ){
        errors.push({message: "Title is invalid"})
    }

    if(validator.isEmpty(postInput.content) ||
        !validator.isLength(postInput.content, {min:5})
    ){
        errors.push({message: "Content is invalid"})
    }

    if(errors.length){
        const error = new Error('Invalid Input');
        error.data = errors;
        error.code = 422;
        throw error;
    }

    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user
    })

    const createdPost = await post.save();
    user.posts.push(createdPost);

    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    }
  },

  posts: async function ({page}, req) {
    checkAuth(req.isAuth);

    if(!page){
      page = 1;
    }
  
    const ITEMS_PER_PAGE = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate("creator");

    return { posts:posts.map(p=>{
      return {
        ...p._doc,
        _id: p._id.toString(),
        createdAt: p.createdAt.toISOString(),
        upadtedAt: p.updatedAt.toISOString()
      }
    }), totalPosts: totalPosts }
  },

  post: async function ({id}, req) {
    checkAuth(req.isAuth);
    
    const post = await Post.findById(id).populate('creator');

    if(!post){
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id:post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  },

  updatePost: async function ({id, postInput}, req) {
    checkAuth(req.isAuth);
    
    const post = await Post.findById(id).populate('creator');
    if(!post){
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    
    if(post.creator._id.toString() !== req.userId.toString()){
      throw new Error("Unauthorized");
    }

    const errors = [];

    if(validator.isEmpty(postInput.title) ||
        !validator.isLength(postInput.title, {min:5})
    ){
        errors.push({message: "Title is invalid"})
    }

    if(validator.isEmpty(postInput.content) ||
        !validator.isLength(postInput.content, {min:5})
    ){
        errors.push({message: "Content is invalid"})
    }

    if(errors.length){
        const error = new Error('Invalid Input');
        error.data = errors;
        error.code = 422;
        throw error;
    }
    
    post.title = postInput.title;
    post.content = postInput.content;
    if(postInput.imageUrl !== 'undefined'){
      post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();
    return { 
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()     
    }
  },

  deletePost: async function ({id}, req) {
    checkAuth(req.isAuth);
    
    const post = await Post.findById(id);
    if(!post){
      const error = new Error('No post found!');
      error.code = 404;
      throw error;
    }
    
    if(post.creator.toString() !== req.userId.toString()){
      throw new Error("Unauthorized");
    }
   
    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(id);

    const user = await User.findById(req.userId);
    user.posts.pull(id);
    await user.save();

    return true;
  },

  user: async function (args, req) {
    checkAuth(req.isAuth);

    const user = await User.findById(req.userId);
    if(!user) throw new Error("No user found");
    
    return {...user._doc, _id:user._id.toString()}
  },

  updateStatus: async function ({status}, req) {
    checkAuth(req.isAuth);

    const user  = await User.findById(req.userId);
    if(!user) throw new Error("User not found");

    user.status = status;

    await user.save();

    return {...user._doc, _id: user._id.toString()}
  }
};

checkAuth = (isAuth)=>{
  if(!isAuth){
    const error = new Error("Unauthorized");
    error.code = 401;
    throw error;
  }  
}
