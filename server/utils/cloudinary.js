  
let cloudinary = require("cloudinary").v2;


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAMEA,
    api_key: process.env.CLOUDINARY_API_KEYA,
    api_secret: process.env.CLOUDINARY_API_SECRETA
});

module.exports = cloudinary;