const { validationResult } = require('express-validator');
const Post = require('../models/post');
const fs = require('fs');
const path = require('path');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page || 1;
  const ITEMS_PER_PAGE = 2;
  let totalItems;

  Post.find().countDocuments()
  .then(count=>{
    totalItems = count;

    return Post.find()
    .skip((currentPage - 1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE);
  })
  .then(posts=>{
    res.status(200).json({
      message:'Fetched posts successfully', 
      posts,
      totalItems
    });
  })
  .catch(e=>{
    if(!e) e.statusCode = 500;
    next(e);  
  });
};

exports.createPost = (req, res, next) => {
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
  let creator;
  // console.log('IMAGE URL',imageUrl);
  const post = new Post({
    title: title, 
    content: content,
    imageUrl:imageUrl,
    creator: req.userId
  });
  // Create post in db

  post.save()
  .then(result=>{
    return User.findById(req.userId);
  })
  .then(user=>{
    creator = user;
    user.posts.push(post);

    return user.save();
  })
  .then(result=>{
    res.status(201).json({
      message: 'Post created successfully!',
      post: post,
      creator:{_id: creator._id, name: creator.username}
    });
  })
  .catch(e=>{
    if(!e.statusCode)
      e.statusCode = 500;
    next(e);
  })
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

exports.updatePost = (req,res,next)=>{
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

  Post.findById(postId)
  .then(post=>{
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 422;
      throw error;  
    }

    if(imageUrl !== post.imageUrl){
      clearImage(post.imageUrl);//delete the old image
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;

    return post.save();
  })
  .then(result=>{
    res.status(200).json({message:"Post updated successfully", post:result});
  })
  .catch(e=>{
    if(!e) e.statusCode = 500;
    next(e);
  })
}

exports.deletePost = (req, res, next)=>{
  const postId = req.params.postId;

  Post.findById(postId)
  .then(post=>{
    if(post) clearImage(post.imageUrl);

    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 422;
      throw error;  
    }
    
    return Post.findByIdAndRemove(postId);
  })
  .then(result=>{
    res.status(200).json({message:"Post deleted successfully!"});
  })
  .catch(e=>{console.log(e)})
}
const clearImage = filePath=>{
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err=>{
    console.log(err);
  })
}