const asyncHandler = require('../middleware/async');
const Designer = require('../models/designer');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Register Designer
// @route   POST /api/v1/designers/register
exports.register = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const existingDesigner = await Designer.findOne({ email });
    if (existingDesigner) {
        return res.status(400).json({ message: "Designer already exists" });
    }

    // If image uploaded, add filename to req.body
    if (req.file) {
        req.body.image = req.file.filename;
    }

    const designer = await Designer.create(req.body);

    res.status(201).json({
        success: true,
        message: "Designer registered successfully",
        data: {
            _id: designer._id,
            name: designer.name,
            email: designer.email,
            image: designer.image,  // Include image filename here if you want
        },
    });
});


// @desc    Login Designer
// @route   POST /api/v1/designers/login
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const designer = await Designer.findOne({ email });
    if (!designer) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, designer.password);
    if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
            _id: designer._id,
            name: designer.name,
            email: designer.email,
        },
    });
});

// @desc    Get Designer Profile
// @route   GET /api/v1/designers/:id
exports.getProfile = asyncHandler(async (req, res) => {
    const designer = await Designer.findById(req.params.id).select('-password');

    if (!designer) {
        return res.status(404).json({ message: 'Designer not found' });
    }

    res.status(200).json({
        success: true,
        data: designer,
    });
});

// @desc    Forgot Password (send reset link)
// @route   POST /api/v1/designers/forgotpassword
exports.forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await Designer.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: 'No user with that email' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `http://localhost:5173/aresetpassword/${resetToken}`;

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: '"VisionVault Support" <no-reply@vision.com>',
        to: email,
        subject: 'Password Reset Request',
        html: `<p>Click to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email.',
    });
});

// @desc    Verify reset token
// @route   GET /api/v1/designers/resetpassword/:token
exports.verifyResetToken = asyncHandler(async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await Designer.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    res.status(200).json({
        success: true,
        message: "Reset token is valid. You can now reset your password.",
        data: { email: user.email },
    });
});

// @desc    Reset Password
// @route   POST /api/v1/designers/resetpassword/:token
exports.resetPassword = asyncHandler(async (req, res) => {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await Designer.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    }

    if (!req.body.password) {
        return res.status(400).json({ success: false, message: "Password is required" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
});

// @desc    Get All Designers
// @route   GET /api/v1/designers
exports.getAllDesigners = asyncHandler(async (req, res) => {
    const designers = await Designer.find().select('-password');
    res.status(200).json({
        success: true,
        count: designers.length,
        data: designers,
    });
}); 

exports.updateProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Extract fields from req.body
    const { name, email, phone, experience, portfolio } = req.body;

    // Build update object with provided fields
    const updateData = { name, email, phone, experience, portfolio };

    // If an image file is uploaded, save the filename
    if (req.file) {
        updateData.image = req.file.filename;
    }

    // Find and update the designer
    const updatedDesigner = await Designer.findByIdAndUpdate(id, updateData, {
        new: true, // return the updated document
        runValidators: true,
    }).select('-password'); // exclude password in response

    if (!updatedDesigner) {
        return res.status(404).json({ message: 'Designer not found' });
    }

    res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedDesigner,
    });
});