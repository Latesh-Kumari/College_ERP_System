const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')
//const keys = require('../config/key')
//const sendEmail = require('../utils/nodemailer')
//const Student = require('../models/student')
//const Subject = require('../models/subject')
//const Attendence = require('../models/attendence')
//const Message = require('../models/message')
//const Mark = require("../models/marks")

//File Handler
//const bufferConversion = require('../utils/bufferConversion')
//const cloudinary = require('../utils/cloudinary')

const validateStudentLoginInput = require('../validation/studentLogin')
const validateStudentUpdatePassword = require('../validation/studentUpdatePassword')
const validateForgotPassword = require('../validation/forgotPassword')
const validateOTP = require('../validation/otpValidation')
const { markAttendence } = require("./facultyController")

module.exports = {
    studentLogin: async (req, res, next) => {
        const { errors, isValid } = validateStudentLoginInput(req.body);

        // Check Validation
        if (!isValid) {
            return res.status(400).json(errors);
        }
        const { registrationNumber, password } = req.body;

        const student = await Student.findOne({ registrationNumber })
        if (!student) {
            errors.registrationNumber = 'Registration number not found';
            return res.status(404).json(errors);
        }
        const isCorrect = await bcrypt.compare(password, student.password)
        if (!isCorrect) {
            errors.password = 'Invalid Credentials';
            return res.status(404).json(errors);
        }
        const payload = { id: student.id, student };
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


    },
    checkAttendence: async (req, res, next) => {
        try {
            const studentId = req.user._id
            const attendence = await Attendence.find({ student: studentId }).populate('subject')
            if (!attendence) {
                res.status(400).json({ message: "Attendence not found" })
            }
            res.status(200).json({
                result: attendence.map(att => {
                    let res = {};
                    res.attendence = ((att.lectureAttended / att.totalLecturesByFaculty) * 100).toFixed(2)
                    res.subjectCode = att.subject.subjectCode
                    res.subjectName = att.subject.subjectName
                    res.maxHours = att.subject.totalLectures
                    res.absentHours = att.totalLecturesByFaculty - att.lectureAttended
                    res.lectureAttended = att.lectureAttended
                    res.totalLecturesByFaculty = att.totalLecturesByFaculty
                    return res
                })
            })
        }
        catch (err) {
            console.log("Error in fetching attendence",err.message)
        }

    },
    getAllStudents: async (req, res, next) => {
        try {
            const { department, year, section } = req.body;
            const students = await Student.find({ department, year, section })
            if (students.length === 0) {
                return res.status(400).json({ message: "No student found" })
            }
            return res.status(200).json({ result: students })

        }
        catch (err) {
            return res.status(400).json({ message: err.message })
        }
    },
}
