const { validationResult } = require('express-validator');
const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
  .then(posts=>{
    res.status(200).json({message:'Fetched posts successfully', posts});
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
  const imageUrl = req.file.path.replace("\\" ,"/") + '.jpg';;
  const title = req.body.title;
  const content = req.body.content;
  console.log('IMAGE URL',imageUrl);
  const post = new Post({
    title: title, 
    content: content,
    imageUrl:imageUrl,
    creator:{
      name:'Shivraj'
    }
  });
  // Create post in db

  post.save()
  .then(result=>{
    res.status(201).json({
      message: 'Post created successfully!',
      post: result
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
