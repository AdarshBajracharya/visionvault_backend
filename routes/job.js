const express = require('express');
const upload = require("../middleware/upload");
const {
  createJobPost,
  getAllJobPosts,
  getJobPostById,
  updateJobPost,
  deleteJobPost,
  getCurrentJobPosts,
  getJobsByConsumer
} = require('../controller/job');


const router = express.Router();

// Public routes
router.get('/', getAllJobPosts);
router.get('/:id', getJobPostById);
router.get('/consumer/:consumerId', getJobsByConsumer);
router.get('/current', getCurrentJobPosts); 
router.post("/", upload.array("referencePics", 8), createJobPost);
router.put('/:id', upload.array("newImages", 8), updateJobPost);
router.delete('/:id', deleteJobPost);

module.exports = router;
