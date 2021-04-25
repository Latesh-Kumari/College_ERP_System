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
    getStudentByName: async (req, res, next) => {
        try {
            const { name } = req.body
            const students = await Student.find({ name })
            if (students.length === 0) {
                return res.status(400).json({ message: "No student found" })
            }
            return res.status(200).json({ result: students })

        }
        catch (err) {
            return res.status(400).json({ message: err.message })
        }
    },
    updatePassword: async (req, res, next) => {
        try {
            const { errors, isValid } = validateStudentUpdatePassword(req.body);
            if (!isValid) {
                return res.status(400).json(errors);
            }
            const { registrationNumber, oldPassword, newPassword, confirmNewPassword } = req.body
            if (newPassword !== confirmNewPassword) {
                errors.confirmNewpassword = 'Password Mismatch'
                return res.status(400).json(errors);
            }
            const student = await Student.findOne({ registrationNumber })
            const isCorrect = await bcrypt.compare(oldPassword, student.password)
            if (!isCorrect) {
                errors.oldPassword = 'Invalid old Password';
                return res.status(404).json(errors);
            }
            let hashedPassword;
            hashedPassword = await bcrypt.hash(newPassword, 10)
            student.password = hashedPassword;
            await student.save()
            res.status(200).json({ message: "Password Updated" })
        }
        catch (err) {
            console.log("Error in updating password", err.message)
        }
    },
    forgotPassword: async (req, res, next) => {
        try {
            const { errors, isValid } = validateForgotPassword(req.body);
            if (!isValid) {
                return res.status(400).json(errors);
            }
            const { email } = req.body
            const student = await Student.findOne({ email })
            if (!student) {
                errors.email = "Email Not found, Provide registered email"
                return res.status(400).json(errors)
            }
            function generateOTP() {
                var digits = '0123456789';
                let OTP = '';
                for (let i = 0; i < 6; i++) {
                    OTP += digits[Math.floor(Math.random() * 10)];
                }
                return OTP;
            }
            const OTP = await generateOTP()
            student.otp = OTP
            await student.save()
            await sendEmail(student.email, OTP, "OTP")
            res.status(200).json({ message: "check your registered email for OTP" })
            const helper = async () => {
                student.otp = ""
                await student.save()
            }
            setTimeout(function () {
                helper()
            }, 300000);
        }
        catch (err) {
            console.log("Error in sending email", err.message)
        }
    },
    getStudentByRegName: async (req, res, next) => {
        try {
            const { registrationNumber } = req.body
            const students = await Student.findOne({ registrationNumber })
            if (!students) {
                return res.status(400).json({ message: "No student found" })
            }
            return res.status(200).json({ result: students })

        }
        catch (err) {
            return res.status(400).json({ message: err.message })
        }
    },
    postOTP: async (req, res, next) => {
        try {
            const { errors, isValid } = validateOTP(req.body);
            if (!isValid) {
                return res.status(400).json(errors);
            }
            const { email, otp, newPassword, confirmNewPassword } = req.body
            if (newPassword !== confirmNewPassword) {
                errors.confirmNewPassword = 'Password Mismatch'
                return res.status(400).json(errors);
            }
            const student = await Student.findOne({ email });
            if (student.otp !== otp) {
                errors.otp = "Invalid OTP, check your email again"
                return res.status(400).json(errors)
            }
            let hashedPassword;
            hashedPassword = await bcrypt.hash(newPassword, 10)
            student.password = hashedPassword;
            await student.save()
            return res.status(200).json({ message: "Password Changed" })
        }
        catch (err) {
            console.log("Error in submitting otp", err.message)
            return res.status(200)
        }
    },
    postPrivateChat: async (req, res, next) => {
        try {
            const { senderName, senderId, roomId,
                receiverRegistrationNumber,senderRegistrationNumber,message } = req.body

            const receiverStudent = await Student.findOne({ registrationNumber: receiverRegistrationNumber })
            const newMessage = await new Message({
                senderName,
                senderId,
                roomId,
                message,
                senderRegistrationNumber,
                receiverRegistrationNumber,
                receiverName: receiverStudent.name,
                receiverId: receiverStudent._id,
                createdAt: new Date()
            })
            await newMessage.save()
        }
        catch (err) {
            console.log("Error in post private chat", err.message)
        }
    },
    getPrivateChat: async (req, res, next) => {
        try {
            const { roomId } = req.params
            const swap = (input, value_1, value_2) => {
                let temp = input[value_1];
                input[value_1] = input[value_2];
                input[value_2] = temp;
            }
            const allMessage = await Message.find({ roomId })
            let tempArr = roomId.split(".")
            swap(tempArr, 0, 1)
            let secondRomId = tempArr[0] + '.' + tempArr[1]
            const allMessage2 = await Message.find({ roomId: secondRomId })
            var conversation = allMessage.concat(allMessage2);
            conversation.sort();
            res.status(200).json({ result: conversation })
        }
        catch (err) {
            console.log("errr in getting private chat server side", err.message)

        }
    },
}
