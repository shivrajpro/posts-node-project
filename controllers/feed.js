const { validationResult } = require('express-validator');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');
const io = require('../socket');
exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 2;

  try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find().populate('creator')
    .sort({createAt:-1})//descending order
    .skip((currentPage - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  
    res.status(200).json({
      message:'Fetched posts successfully', 
      posts,
      totalItems
    });
      
  } catch (e) {
    if(!e) e.statusCode = 500;
    next(e);  
  }
};

exports.createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }

  if(!req.file){
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path.replace("\\" ,"/");
  const title = req.body.title;
  const content = req.body.content;
  // console.log('IMAGE URL',imageUrl);
  const post = new Post({
    title: title, 
    content: content,
    imageUrl:imageUrl,
    creator: req.userId
  });
  // Create post in db

  try {
    await post.save();
    const creator = await User.findById(req.userId);
  
    creator.posts.push(post);
    await creator.save();

    io.getIO().emit('posts',{ action:'create', post:{...post._doc,
    creator:{_id:req.userId, name:creator.username}
    } });

    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator:{_id: creator._id, name: creator.username}
    });
  } catch (e) {
    if(!e) e.statusCode = 500;
    next(e);  
  }
};

exports.getPost = (req, res, next)=>{
  const postId = req.params.postId;
  
  Post.findById(postId)
  .then(post=>{
    if(!post){
      const error = new Error('Validation failed, entered data is incorrect');
      error.statusCode = 422;
      throw error;  
    }
    res.status(200).json({message:"Post fetched", post});
  })
  .catch(e=>{
    if(!e) e.statusCode = 500;
    next(e);
  })
}

exports.updatePost = async (req,res,next)=>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }

  const postId = req.params.postId;
  const title = req.body.title;
  const content  = req.body.content;
  let imageUrl = req.body.image;

  if(req.file)
    imageUrl = req.file.path.replace("\\" ,"/");
  
  if(!imageUrl){
    const error = new Error("No file picked");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(postId).populate('creator');
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 422;
      throw error;  
    }
  
    if(post.creator._id.toString() !== req.userId){
      const error = new Error('Unauthorized');
      error.statusCode = 422;
      throw error;  
    }
  
    if(imageUrl !== post.imageUrl){
      clearImage(post.imageUrl);//delete the old image
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
  
    const result = await post.save();

    io.getIO().emit('posts',{ action:'update', post: result});
  
    res.status(200).json({message:"Post updated successfully", post:result});
      
  } catch (e) {
    if(!e) e.statusCode = 500;
    next(e);
  }

}

exports.deletePost = async (req, res, next)=>{
  const postId = req.params.postId;

  try {
    const post = await Post.findById(postId);
    if(post) clearImage(post.imageUrl);
  
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 422;
      throw error;  
    }
   
    if(post.creator.toString() !== req.userId){
      const error = new Error('Unauthorized');
      error.statusCode = 422;
      throw error;  
    }
    
    const result = await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    user.posts.pull(postId);
    await user.save();
    io.getIO().emit('posts', {action:'delete', post:postId});
    res.status(200).json({message:"Post deleted successfully!"});
      
  } catch (e) {
    if(!e) e.statusCode = 500;
    next(e);  
  }

}

const clearImage = filePath=>{
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err=>{
    console.log(err);
  })
}