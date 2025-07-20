const express = require("express");
const upload = require('../middleware/upload');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} = require("../controller/consumer");

router.post("/register", upload.single('image'), register);
router.post("/login", login);

router.post("/forgotpassword", forgotPassword);
router.get("/resetpassword/:token", verifyResetToken);
router.post("/resetpassword/:token", resetPassword);
router.get("/:id", getProfile);

module.exports = router;
