const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
//const sendEmail = require('../utils/nodemailer')
//const Student = require('../models/student')
//const Subject = require('../models/subject')
//const Faculty = require('../models/faculty')
//const Attendence = require('../models/attendence')
// const Mark = require('../models/marks')

//const keys = require('../config/key')

//File Handler
//const bufferConversion = require('../utils/bufferConversion')
//const cloudinary = require('../utils/cloudinary')

const validateFacultyLoginInput = require('../validation/facultyLogin')
const validateFetchStudentsInput = require('../validation/facultyFetchStudent')
const validateFacultyUpdatePassword = require('../validation/FacultyUpdatePassword')
const validateForgotPassword = require('../validation/forgotPassword')
const validateOTP = require('../validation/otpValidation')
const validateFacultyUploadMarks = require('../validation/facultyUploadMarks')

module.exports = {
    facultyLogin: async (req, res, next) => {
        try {
            const { errors, isValid } = validateFacultyLoginInput(req.body);
            // Check Validation
            if (!isValid) {
                return res.status(400).json(errors);
            }
            const { registrationNumber, password } = req.body;

            const faculty = await Faculty.findOne({ registrationNumber })
            if (!faculty) {
                errors.registrationNumber = 'Registration number not found';
                return res.status(404).json(errors);
            }
            const isCorrect = await bcrypt.compare(password, faculty.password)
            if (!isCorrect) {
                errors.password = 'Invalid Credentials';
                return res.status(404).json(errors);
            }
            const payload = {
                id: faculty.id, faculty
            };
            jwt.sign(
                payload,
                keys.secretOrKey,
                { expiresIn: 3600 },
                (err, token) => {
                    res.json({
                        success: true,
                        token: 'Bearer ' + token
                    });
                }
            );
        }
        catch (err) {
            console.log("Error in faculty login", err.message)
        }
    },

}
