const mongoose = require('mongoose');

const JobPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    referencePics: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'consumer', 
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobPost', JobPostSchema);
