const asyncHandler = require('../middleware/async');
const JobPost = require('../models/job');

// @desc    Create Job Post
// @route   POST /api/v1/job
exports.createJobPost = async (req, res) => {
  try {
    const { title, description, type, createdBy } = req.body;

    if (!title || !description || !type || !createdBy) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Map uploaded files to filenames
    const referencePics = req.files ? req.files.map((file) => file.filename) : [];

    const job = await JobPost.create({
      title,
      description,
      type,
      createdBy,
      referencePics,
    });

    res.status(201).json({
      success: true,
      message: "Job post created successfully.",
      data: job,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// @desc    Get all Job Posts
// @route   GET /api/v1/job
exports.getAllJobPosts = asyncHandler(async (req, res) => {
  const jobPosts = await JobPost.find().populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: jobPosts.length,
    data: jobPosts,
  });
});

// @desc    Get single Job Post by ID
// @route   GET /api/v1/job/:id
exports.getJobPostById = asyncHandler(async (req, res) => {
  const jobPost = await JobPost.findById(req.params.id).populate('createdBy', 'name email');

  if (!jobPost) {
    return res.status(404).json({ message: 'Job post not found' });
  }

  res.status(200).json({
    success: true,
    data: jobPost,
  });
});

// @desc    Update Job Post by ID (no auth, anyone can update — be careful)
// @route   PUT /api/v1/job/:id
exports.updateJobPost = asyncHandler(async (req, res) => {
  const jobPost = await JobPost.findById(req.params.id);

  if (!jobPost) {
    return res.status(404).json({ message: 'Job post not found' });
  }

  // Parse existingImages sent as JSON string, fallback to empty array
  let existingImages = [];
  if (req.body.existingImages) {
    try {
      existingImages = JSON.parse(req.body.existingImages);
    } catch {
      existingImages = [];
    }
  }

  // Delete images that are currently in DB but NOT in existingImages
  const imagesToDelete = jobPost.referencePics.filter(
    (img) => !existingImages.includes(img)
  );

  imagesToDelete.forEach((img) => deleteFile(img));

  // Newly uploaded images filenames (if multer used)
  const newImageFiles = req.files ? req.files.map((file) => file.filename) : [];

  // Combine existingImages + new uploaded images for final array
  const updatedImages = [...existingImages, ...newImageFiles];

  // Update other fields
  jobPost.title = req.body.title || jobPost.title;
  jobPost.description = req.body.description || jobPost.description;
  jobPost.type = req.body.type || jobPost.type;
  jobPost.referencePics = updatedImages;

  await jobPost.save();

  res.status(200).json({
    success: true,
    message: 'Job post updated successfully',
    data: jobPost,
  });
});

// @desc    Delete Job Post by ID (no auth, anyone can delete — be careful)
// @route   DELETE /api/v1/job/:id
exports.deleteJobPost = asyncHandler(async (req, res) => {
  const jobPost = await JobPost.findById(req.params.id);

  if (!jobPost) {
    return res.status(404).json({ message: 'Job post not found' });
  }

  // Use deleteOne instead of remove
  await jobPost.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Job post deleted successfully',
  });
});


// @desc    Get current Job Posts (e.g., last 30 days)
// @route   GET /api/v1/job/current
exports.getCurrentJobPosts = asyncHandler(async (req, res) => {
  const THIRTY_DAYS_AGO = new Date();
  THIRTY_DAYS_AGO.setDate(THIRTY_DAYS_AGO.getDate() - 30);

  const currentJobs = await JobPost.find({
    createdAt: { $gte: THIRTY_DAYS_AGO },
  }).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: currentJobs.length,
    data: currentJobs,
  });
});


// @desc    Get Job Posts by Consumer ID
// @route   GET /api/v1/job/consumer/:consumerId
exports.getJobsByConsumer = asyncHandler(async (req, res) => {
  const { consumerId } = req.params;

  const jobs = await JobPost.find({ createdBy: consumerId }).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs,
  });
});