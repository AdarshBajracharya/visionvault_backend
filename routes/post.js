const express = require('express');
const upload = require("../middleware/upload");
const {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsByDesignerId,
} = require('../controller/post');


const router = express.Router();

// Public routes

router.get('/', getAllPosts);
router.get('/designer/:designerId', getPostsByDesignerId);
router.get('/:id', getPostById);
router.post("/", upload.array("referencePics", 8), createPost);
router.put('/:id', upload.array("referencePics", 8), updatePost);
router.delete('/:id', deletePost);

module.exports = router;
