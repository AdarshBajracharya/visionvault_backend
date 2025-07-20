const express = require("express");

const upload = require('../middleware/upload');
const router = express.Router();
const {
    register,
    login,
    getProfile,
    forgotPassword,
    getAllDesigners,
    resetPassword,
    verifyResetToken,
    updateProfile
} = require("../controller/designer");

router.post('/register', upload.single('image'), register);
router.post("/login", login);
router.put("/:id", upload.single('image'), updateProfile);
router.get("/:id", getProfile);
router.post("/forgotpassword", forgotPassword);
router.get('/', getAllDesigners); 
router.get("/resetpassword/:token", verifyResetToken);
router.post("/resetpassword/:token", resetPassword);

module.exports = router;
