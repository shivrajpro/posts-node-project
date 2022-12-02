const express = require('express');
const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
const { default: mongoose } = require('mongoose');

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes);

mongoose.connect('mongodb+srv://shivraj:shiv@cluster0.bu9ow60.mongodb.net/posts')
.then(result=>{
    console.log('CONNECTED');
    app.listen(8080);
}).catch(e=> console.log(e))