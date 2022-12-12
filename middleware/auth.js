const jwt = require('jsonwebtoken');

function throwError() {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
}
module.exports = (req, res, next)=>{
    const authHeader = req.get('Authorization');
    if(!authHeader){
        // throwError();
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1]; //"Bearer token"

    let decodedToken;

    try{
        decodedToken = jwt.verify(token, 'somesupersecretsecret')
    }catch(e){
        req.isAuth = false;
        return next();
    }

    if(!decodedToken){
        // throwError();
        req.isAuth = false;
        return next();
    }

    req.userId = decodedToken.userId;
    req.isAuth = true;
    next()
}