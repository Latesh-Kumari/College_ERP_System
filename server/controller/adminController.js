const bcrypt = require('bcryptjs')
const gravatar = require('gravatar')
const jwt = require('jsonwebtoken')


//Validation
const validateAdminRegisterInput = require('../validation/adminRegister')
const validateFacultyRegisterInput = require('../validation/facultyRegister')
const validateStudentRegisterInput = require('../validation/studentRegister')
const validateAdminLoginInput = require('../validation/adminLogin')
const validateSubjectRegisterInput = require('../validation/subjectRegister')

//Models
//const Subject = require('../models/subject')
//const Student = require('../models/student')
//const Faculty = require('../models/faculty')
//const Admin = require('../models/admin')

//Config
//const keys = require('../config/key')

module.exports = {
    addAdmin: async (req, res, next) => {
        try {
            const { errors, isValid } = validateAdminRegisterInput(req.body);
            if (!isValid) {
                return res.status(400).json(errors)
            }
            const { name, email,
                dob,department, contactNumber} = req.body
            const admin = await Admin.findOne({ email })
            if (admin) {
                errors.email = "Email already exist"
                return res.status(400).json(errors)
            }
            const avatar = gravatar.url(email, { s: '200', r: 'pg', d: 'mm' })
            let departmentHelper;
            if (department === "C.S.E") {
                departmentHelper = "01"
            }
            else if (department === "E.C.E") {
                departmentHelper = "02"
            }
            else if (department === "I.T") {
                departmentHelper = "03"
            }
            else if (department === "Mechanical") {
                departmentHelper = "04"
            }
            else if (department === "Civil") {
                departmentHelper = "05"

            }
            else if (department === "E.E.E") {
                departmentHelper = "06"
            }
            else {
                departmentHelper = "00"
            }

            const admins = await Admin.find({ department })
            let helper;
            if (admins.length < 10) {
                helper = "00" + admins.length.toString()
            }
            else if (students.length < 100 && students.length > 9) {
                helper = "0" + admins.length.toString()
            }
            else {
                helper = admins.length.toString()
            }
            let hashedPassword;
            hashedPassword = await bcrypt.hash(dob, 10)
            var date = new Date();
            const joiningYear = date.getFullYear()
            var components = [
                "ADM",
                date.getFullYear(),
                departmentHelper,
                helper
            ];

            var registrationNumber = components.join("");
            const newAdmin = await new Admin({
                name,
                email,
                password: hashedPassword,
                joiningYear,
                registrationNumber,
                department,
                avatar,
                contactNumber,
                dob,
            })
            await newAdmin.save()
            res.status(200).json({ result: newAdmin })
        }
        catch (err) {
            res.status(400).json({ message: `error in adding new admin", ${err.message}` })
        }

    },
    getAllStudents: async (req, res, next) => {
        try {
            const { branch, name } = req.body
            const students = await Student.find({})
            if (students.length === 0) {
                return res.status(404).json({ message: "No students found" })
            }
            res.status(200).json({ result: students })
        }
        catch (err) {
            res.status(400).json({ message: `error in getting all student", ${err.message}` })
        }

    },
}
