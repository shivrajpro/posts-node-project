const jwt = require('jsonwebtoken');

function throwError() {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
}
module.exports = (req, res, next)=>{
    const authHeader = req.get('Authorization');
    const token = authHeader.split(' ')[1];

    if(!authHeader){
        throwError();
    }
    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'somesupersecretsecret')
    }catch(e){
        e.statusCode = 500;
        throw e;
    }

    if(!decodedToken){
        throwError();
    }

    req.userId = decodedToken.userId;
    next()
}