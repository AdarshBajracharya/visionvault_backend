const asyncHandler = require('../middleware/async');
const Consumer = require('../models/consumer.js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// @desc    Register Consumer
// @route   POST /api/v1/consumers/register
exports.register = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existingConsumer = await Consumer.findOne({ email });
  if (existingConsumer) {
    return res.status(400).json({ message: "Consumer already exists" });
  }

  // Build consumerData object from req.body and optional image
  const consumerData = { ...req.body };
  if (req.file) {
    consumerData.image = req.file.filename;
  }

  const consumer = await Consumer.create(consumerData);

  res.status(201).json({
    success: true,
    message: "Consumer registered successfully",
    data: {
      _id: consumer._id,
      name: consumer.name,
      email: consumer.email,
      image: consumer.image || null,
    },
  });
});

// @desc    Login Consumer
// @route   POST /api/v1/consumers/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const consumer = await Consumer.findOne({ email });
  if (!consumer) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, consumer.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      _id: consumer._id,
      name: consumer.name,
      email: consumer.email,
    },
  });
});

// @desc    Get Consumer Profile
// @route   GET /api/v1/consumers/:id
exports.getProfile = asyncHandler(async (req, res) => {
  const consumer = await Consumer.findById(req.params.id).select('-password');

  if (!consumer) {
    return res.status(404).json({ message: 'Consumer not found' });
  }

  res.status(200).json({
    success: true,
    data: consumer,
  });
});

// @desc    Forgot Password (send reset link)
// @route   POST /api/v1/consumers/forgotpassword
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await Consumer.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'No user with that email' });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `http://localhost:5173/consumerreset/${resetToken}`;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"PawPal Support" <no-reply@pawpal.com>',
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
// @route   GET /api/v1/consumers/resetpassword/:token
exports.verifyResetToken = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await Consumer.findOne({
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
// @route   POST /api/v1/consumers/resetpassword/:token
exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await Consumer.findOne({
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


exports.updateProfile = asyncHandler(async (req, res) => {
  const designer = await Designer.findById(req.params.id);
  if (!designer) {
    return res.status(404).json({ message: "Designer not found" });
  }

  designer.name = req.body.name || designer.name;
  designer.phone = req.body.phone || designer.phone;
  designer.experience = req.body.experience || designer.experience;
  designer.portfolio = req.body.portfolio || designer.portfolio;

  // Update image if file uploaded
  if (req.file) {
    designer.image = req.file.filename;
  }

  await designer.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: designer,
  });
});
