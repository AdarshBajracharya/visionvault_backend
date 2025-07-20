const asyncHandler = require('../middleware/async');
const Post = require('../models/post');

// @desc    Create Job Post
// @route   POST /api/v1/job
exports.createPost = async (req, res) => {
  try {
    const { title, description, type, createdBy } = req.body;

    if (!title || !description || !type || !createdBy) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Map uploaded files to filenames
    const referencePics = req.files ? req.files.map((file) => file.filename) : [];

    const post = await Post.create({
      title,
      description,
      type,
      createdBy,
      referencePics,
    });

    res.status(201).json({
      success: true,
      message: "post created successfully.",
      data: post,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

// @desc    Get all Job Posts
// @route   GET /api/v1/job
exports.getAllPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find().populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});

// @desc    Get single Job Post by ID
// @route   GET /api/v1/job/:id
exports.getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('createdBy', 'name email');

  if (!post) {
    return res.status(404).json({ message: 'post not found' });
  }

  res.status(200).json({
    success: true,
    data: post,
  });
});

// @desc    Update Job Post by ID (no auth, anyone can update — be careful)
// @route   PUT /api/v1/job/:id
exports.updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'post not found' });

  const updatedFields = {
    title: req.body.title || post.title,
    description: req.body.description || post.description,
    type: req.body.type || post.type,
  };

  if (req.files && req.files.length > 0) {
    updatedFields.referencePics = req.files.map(file => file.filename);
  }

  const updatedPost = await Post.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

  res.status(200).json({
    success: true,
    message: 'post updated successfully',
    data: updatedPost,
  });
});


// @desc    Delete Job Post by ID (no auth, anyone can delete — be careful)
// @route   DELETE /api/v1/job/:id
exports.deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return res.status(404).json({ message: 'post not found' });
  }

  await Post.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'post deleted successfully',
  });
});

// @desc    Get all posts by a specific designer
// @route   GET /api/v1/job/designer/:designerId
exports.getPostsByDesignerId = asyncHandler(async (req, res) => {
  const { designerId } = req.params;

  const posts = await Post.find({ createdBy: designerId }).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    count: posts.length,
    data: posts,
  });
});
