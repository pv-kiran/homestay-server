const jwt = require('jsonwebtoken');

const getToken = async(userId,email) => {

    return jwt.sign(
        {userId : userId,email : email},
        process.env.SECRET_KEY,
        {expiresIn : "2h"}
    );
}

const verifyToken = (token) => {
    return jwt.verify(token,process.env.SECRET_KEY);
}

module.exports = {
    getToken,
    verifyToken
}