const Job = require("../models/jobModel");

// Get all jobs
async function getAllJobs() {
  try {
    // Retrieve all jobs from the database
    const jobs = await Job.find();

    return jobs;
  } catch (error) {
    console.error(error);
    throw new Error("Error while retrieving jobs");
  }
}

// Get a single job by ID
async function getJobById(jobId) {
  try {
    // Find the job in the database based on the job ID
    const job = await Job.findById(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    return job;
  } catch (error) {
    console.error(error);
    throw new Error("Error while retrieving the job");
  }
}

async function getJobByTitle(title) {
  try {
    const job = await Job.find({ title });
    return job;
  } catch (error) {
    throw error;
  }
}

// Create a new job
async function createJob(jobData) {
  try {
    // Create a new job using the provided job data
    const job = new Job(jobData);

    // Save the job to the database
    const createdJob = await job.save();

    return createdJob;
  } catch (error) {
    console.error(error);
    throw new Error("Error while creating the job");
  }
}

// Update a job by ID
async function updateJob(jobId, jobData) {
  try {
    // Find the job in the database based on the job ID
    const job = await Job.findById(jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    // Update the job data
    Object.assign(job, jobData);

    // Save the updated job to the database
    const updatedJob = await job.save();

    return updatedJob;
  } catch (error) {
    console.error(error);
    throw new Error("Error while updating the job");
  }
}

async function deleteJob(jobId) {
  console.log("Inside jobsService/deleteJob function");

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      throw new Error("Job not found");
    }

    await job.remove();
    console.log(job);

    return { message: "Job deleted successfully" };
  } catch (error) {
    throw new Error("Error deleting job");
  }
}
// Get jobs by user ID
async function getJobsByUserId(userId) {
  try {
    // Query the database to find jobs that belong to the specified user ID
    const jobs = await Job.find({ postedBy: userId });

    return jobs;
  } catch (error) {
    throw new Error("Error in getJobsByUserId function");
  }
}
// Get created jobs by user ID
async function getCreatedJobs(userId) {
    try {
      // Query the database to find jobs posted by the specified user ID
      const createdJobs = await Job.find({ postedBy: userId });
  
      return createdJobs;
    } catch (error) {
      throw new Error("Error in getCreatedJobs function");
    }
  }
  async function deleteJobApplication(jobId, userId) {
    try {
      // Find the job by its ID and remove the user from the appliedBy array
      const job = await Job.findById(jobId);
      if (!job) {
        throw new Error("Job not found");
      }
  
      // Remove the user from the appliedBy array based on their user ID
      job.appliedBy = job.appliedBy.filter((user) => user.toString() !== userId);
  
      // Save the updated job to the database
      const updatedJob = await job.save();
  
      return updatedJob;
    } catch (error) {
      throw new Error("Error deleting job application");
    }
  }
  
module.exports = {
  getAllJobs,
  getJobById,
  getJobByTitle,
  createJob,
  updateJob,
  deleteJob,
  getJobsByUserId,
  getCreatedJobs,
  deleteJobApplication,
};
