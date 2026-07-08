const cloudinary = require('../config/cloudinary.config');
const fs = require('fs-extra');

async function uploadImage(filePath) {
    if (!filePath) {
        return {
            url: null,
            publicId: null
        }
    }

    const result = await cloudinary.uploader.upload(filePath, {
        folder: "online_quiz_system"
    });

    // after upload to cloud remove image in folder (public/uploads/filename)
    await fs.removeSync(filePath);

    return {
        url: result.secure_url,
        publicId: result.public_id
    };
};

module.exports = uploadImage;