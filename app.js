const express = require('express');
const bodyParser = require('body-parser');
const multer = require("multer");
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');

const mongoose = require('mongoose');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const app = express();
const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/jpg"
    )
      cb(null, true);
    else cb(null, false);
};
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "images");
      //folder name in which images will be stored and the same will be included to add the images in DB
    },
    filename: (req, file, cb) => {
      // cb(null, uuidv4());
      cb(null, (Date.now() + "-" + file.originalname));
    }
});
// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(cors());
app.use(bodyParser.json()); // application/json
app.use('/images', express.static(path.join(__dirname, 'images')));

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
//     if(req.method === 'OPTIONS')
//       res.sendStatus(200);
//     next();
// });

app.use(multer({storage: fileStorage, fileFilter}).single('image'));

app.use('/graphql', graphqlHTTP({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(err){
    if(!err.originalError)
      return err;
    
    const data = err.originalError.data;
    const msg = err.message || "An error occurred!";
    const code = err.originalError.code || 500;

    return { message: msg, data: data, status:code }
  }
}))
app.use((err, req, res, next)=>{
    console.log(err);
    const status = err.statusCode || 500;
    const message = err.message;
    const data = err.data;
    res.status(status).json({message, data});
})

mongoose.connect('mongodb+srv://shivraj:shiv@cluster0.bu9ow60.mongodb.net/posts')
.then(result=>{
    console.log('CONNECTED');
    app.listen(8080);
}).catch(e=> console.log(e))