const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  bookmarkedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
  appliedJobs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
  ],
  fullName: {
    type: String,
  },
  cv: {
    type: String,
  },
  profile: {
    type: String,
  },
  phoneNumber: {
    type: String,
  },
  noti: [
    {
      type: String,
      ref: "Job",
    },
  ],
  lastPasswordChange: {
    type: Date,
    default: Date.now,
  },
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  role:{
    type:String
  }
});
// Function to add a job to the user's applied jobs list
userSchema.methods.addAppliedJob = function (jobId) {
  if (!this.appliedJobs.includes(jobId)) {
    this.appliedJobs.push(jobId);
  }
};

// Add the remove function to the schema
userSchema.methods.remove = function () {
  return this.deleteOne();
};

userSchema.statics.findByEmail = async function (email) {
  const user = await this.findOne({ email });
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
