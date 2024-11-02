const multer = require('multer');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this folder exists or handle it accordingly
    },
    filename: (req, file, cb) => {
        // Create a unique filename for the uploaded file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = file.mimetype.split('/')[1]; // Get the file extension
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension); // e.g., iconUrl-1632983841505-123456789.png
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Only jpg, jpeg, and png files are allowed'), false);
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
