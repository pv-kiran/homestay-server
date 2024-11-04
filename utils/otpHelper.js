const generateOtp = () => {
    return 100000 + Math.floor(Math.random() * 900000);
}

const getOtpExpiry = (durationInMinutes = 2) => {
    return Date.now() + durationInMinutes * 60 * 1000;
}


module.exports = {
    generateOtp,
    getOtpExpiry,
}