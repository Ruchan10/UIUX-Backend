const Job = require("../models/jobModel");
const jobsService = require("../services/jobsService");
const User = require("../models/userModel");

// Get all jobs
async function getAllJobs(req, res) {
  try {
    const jobs = await jobsService.getAllJobs();
    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(400).json({ success: false });
  }
}

// Get a single job by ID
async function getJobById(req, res) {
  try {
    const jobId = req.params.id;
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error in getJobById Function" });
  }
}
// Get a single job by title
async function getJobByTitle(req, res) {
  console.log("Inside getJobByTitle function");
  try {
    const jobTitle = req.params.title;
    const job = await jobsService.getJobByTitle(jobTitle);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error in getJobByTitle function" });
  }
}

async function createJob(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    const { title, desc, company, location, salary, jobTime } = req.body;
    const logo = req.file ? req.file.path : null;
    if (
      !title ||
      !desc ||
      !company ||
      !location ||
      !salary ||
      !jobTime ||
      !logo
    ) {
      return res.status(401).json({ error: "Fields cannot be left empty" });
    }
    const newJob = new Job({
      title,
      desc,
      company,
      location,
      logo,
      salary,
      jobTime,
      postedBy: req.user._id, // Assign the authenticated user's ID to postedBy
    });
    if (req.file) {
      Job.logo = req.file.path; // Save the file path to the user's logo field
    }

    // Add user in the database
    const createdJob = await newJob.save();

    res
      .status(201)
      .json({ message: "Job created successfully", job: createdJob });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in createJob fucntion" });
  }
}

// Update a job by ID
async function updateJob(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    const jobId = req.params.id;
    const { title, desc, company, location } = req.body;

    // Check if the authenticated user owns the job
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updatedJob = await jobsService.updateJob(jobId, {
      title,
      desc,
      company,
      location,
    });

    res.json(updatedJob);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error in getJobById function" });
  }
}

// Delete a job by ID
async function deleteJob(req, res) {
  try {
    // Check if user is authenticated
    // if (!req.user) {
    //   return res.status(401).json({ error: "Unauthorized Access" });
    // }

    const jobId = req.params.id;

    // Check if the authenticated user owns the job
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return res.status(409).send({ message: "Job not found" });
    }

    // if (job.postedBy.toString() !== req.user.id) {
    //   return res.status(409).send({ message: "Forbidden" });
    // }

    await jobsService.deleteJob(jobId);
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal server error in deleteJob function" });
  }
}

async function bookmarkJob(req, res) {
  console.log("INSIDE BOOKMARK JOB");
  try {
    const jobId = req.params.id;
    const userId = req.user._id;
    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the job is already bookmarked by the user
    if (user.bookmarkedJobs.includes(jobId)) {
      return res.status(400).json({ error: "Job already bookmarked" });
    }

    // Add the job to the user's bookmarked jobs
    user.bookmarkedJobs.push(jobId);
    await user.save();

    // Add the user to the job's bookmarkedBy array
    job.bookmarkedBy.push(userId);
    await job.save();

    res.json({
      success: true,
      data: user.bookmarkedJobs,
      message: "Job bookmarked successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in add bookmark" });
  }
}

async function unbookmarkJob(req, res) {
  console.log("Inside UN BOOKMARK JOB");
  try {
    const jobId = req.params.id;
    const userId = req.user._id;

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the job is bookmarked by the user
    if (!user.bookmarkedJobs.includes(jobId)) {
      return res.status(400).json({ error: "Job not bookmarked" });
    }

    // Remove the job from the user's bookmarked jobs
    user.bookmarkedJobs.pull(jobId);
    await user.save();

    // Remove the user from the job's bookmarkedBy array
    job.bookmarkedBy.pull(userId);
    await job.save();

    res.json({ message: "Job unbookmarked successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
// Display bookmarked jobs
async function displayBookmarkedJobs(req, res) {
  try {
    // Get the logged-in user's ID from req.user
    const userId = req.user._id;

    // Find the user in the database, including the bookmarked jobs
    const user = await User.findById(userId).populate("bookmarkedJobs");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the bookmarked jobs from the user object
    const bookmarkedJobs = user.bookmarkedJobs;

    // Send the bookmarked jobs as a JSON response
    res.json({
      success: true,
      count: bookmarkedJobs.length,
      data: bookmarkedJobs,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in displayBookmarkedJobs" });
  }
}

async function getAppliedJobs(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }

    // Get the logged-in user's ID from req.user
    const userId = req.user._id;

    // Find the user in the database, including the applied jobs
    const user = await User.findById(userId).populate("appliedJobs");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Extract the applied jobs from the user object
    const appliedJobs = user.appliedJobs;

    res.json({ success: true, count: appliedJobs.length, data: appliedJobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in getAppliedJobs" });
  }
}
async function addAppliedJob(req, res) {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;
    const job = await Job.findById(jobId);

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Check if the job is already applied by the user
    if (user.appliedJobs.includes(jobId)) {
      return res.status(400).json({ error: "Job already Applied" });
    }

    user.appliedJobs.push(jobId);

    // Save the updated user with the new applied job
    await user.save();

    // Add the user to the job's appliedBy array
    job.appliedBy.push(userId);
    await job.save();

    res.json({
      success: true,
      data: user.appliedJobs,
      message: "Job added to applied jobs list successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in addAppliedJob" });
  }
}

async function withdrawAppliedJob(req, res) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized Access" });
    }
    const jobId = req.params.id;

    // Get the logged-in user's ID from req.user
    const userId = req.user._id;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Check if the job is in the user's appliedJobs list
    if (!user.appliedJobs.includes(jobId)) {
      return res
        .status(400)
        .json({ error: "Job is not in the applied jobs list" });
    }

    // Remove the job from the user's appliedJobs list
    user.appliedJobs.pull(jobId);
    await user.save();

    job.appliedBy.pull(userId);
    await job.save();

    res.json({
      success: true,
      data: user.appliedJobs,
      message: "Job withdrawn successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in withdrawAppliedJob" });
  }
}
async function rejectUser(req, res) {
  console.log("IN acceptUSer function");
  try {
    const jobId = req.params.jobId;

    const userId = req.params.userId;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Remove the job from the user's appliedJobs list
    user.appliedJobs.pull(jobId);
    await user.save();

    job.appliedBy.pull(userId);
    await job.save();

    res.json({
      success: true,
      data: user.appliedJobs,
      message: "Job withdrawn successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in withdrawAppliedJob" });
  }
}
async function acceptedUser(req, res) {
  try {
    console.log("In acceptedUser");
    const jobId = req.params.jobId;

    const userId = req.params.userId;
    // Find the job by jobId
    const job = await Job.findById(jobId);

    // Check if the job exists
    if (!job) {
      res.json({ success: false, message: "Job not found" });
    }

    // Check if the user is already accepted for the job
    if (job.acceptedUser.includes(userId)) {
      return res.json({
        success: false,
        message: "User is already accepted for the job",
      });
    }

    // Add the userId to the acceptedUser array
    job.acceptedUser.push(userId);

    // Save the updated job data to the database
    await job.save();

    res.json({
      success: true,
      data: user.appliedJobs,
      message: "User accepted",
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error in accepted User" });
  }
}
// Get jobs by user ID
async function getJobsByUserId(req, res) {
  try {
    // Get the user ID from the request parameters
    const userId = req.params.userId;

    // Find the jobs that belong to the specified user ID
    const jobs = await jobsService.getJobsByUserId(userId);

    if (!jobs) {
      return res.status(404).json({ error: "No jobs found for the user" });
    }

    // Return the jobs associated with the user ID
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in getJobsByUserId function" });
  }
}

// Get jobs by user ID
async function getAppliedUsers(req, res) {
  try {
    // Get the logged-in user's ID from req.user
    const userId = req.user._id;

    // Find all jobs posted by the user, and populate the appliedBy field
    const jobs = await Job.find({ postedBy: userId }).populate("appliedBy");

    // Extract userIds from the appliedBy field of each job
    const appliedUserIds = jobs.map((job) =>
      job.appliedBy.map((user) => user._id)
    );

    // Flatten the array of arrays to get a single array of unique userIds
    const uniqueUserIds = [...new Set(appliedUserIds.flat())];

    res.json({ userIds: uniqueUserIds });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in getJobsByUserId" });
  }
}

async function getApplicants(req, res) {
  try {
    const jobId = req.params.jobId;

    // Find the job by jobId
    const job = await Job.findById(jobId);

    // Check if the job exists
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // Extract the user IDs of those who applied for the job
    const appliedUserIds = job.appliedBy;

    // Fetch the user details for the unique user IDs
    const appliedUsers = await User.find({ _id: { $in: appliedUserIds } });

    res.json({ success: true, count: appliedUsers.length, data: appliedUsers });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error in getApplicantsByJobId" });
  }
}

// Function to remove a job ID from the user's appliedJobs array
async function removeJobId(req, res) {
  try {
    const { jobId } = req.params;
    const userId = req.user._id;

    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Remove the job ID from the user's appliedJobs array
    user.appliedJobs = user.appliedJobs.filter((id) => id.toString() !== jobId);

    // Save the updated user data
    await user.save();

    res.json({
      success: true,
      message: "Job ID removed from user appliedJobs array",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in removeJobId" });
  }
}
module.exports = {
  bookmarkJob,
  unbookmarkJob,
  displayBookmarkedJobs,
  getAllJobs,
  getJobById,
  getJobByTitle,
  createJob,
  updateJob,
  deleteJob,
  getAppliedJobs,
  addAppliedJob,
  withdrawAppliedJob,
  getJobsByUserId,
  getAppliedUsers,
  getApplicants,
  removeJobId,
  rejectUser,
  acceptedUser,
};
