const bcrypt = require('bcrypt')

const getHashedPassword = async(password) => {
    
    const hashedPassword = await bcrypt.hash(password,10);
    return hashedPassword;
}

const verifyPassword = async(password, securedPassword) => {
    try {
        if (!password || !securedPassword) {
            throw new Error('Both password and securedPassword must be provided');
        }

        const isPasswordMatch = await bcrypt.compare(password, securedPassword);

        if (isPasswordMatch === undefined || isPasswordMatch === null) {
            throw new Error('Error in comparing passwords');
        }
        return isPasswordMatch;
    } catch (error) {
        console.error(error);
    }
};


module.exports = {
    getHashedPassword,
    verifyPassword,
}