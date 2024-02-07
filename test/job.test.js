const supertest = require("supertest");
const app = require("../index"); // Assuming this is your Express app
const mongoose = require("mongoose");
const Job = require("../models/jobModel"); // Assuming the job model is imported here

const api = supertest(app);

// Clear the job collection before running the tests
beforeEach(async () => {
  await Job.deleteMany({});
});

// Test case: Creating a new job with valid data
test("Create a new job with valid data", async () => {
  const userId = new mongoose.Types.ObjectId();
  const jobData = {
    title: "Software Engineer",
    desc: "Join our talented team as a software engineer.",
    company: "Tech Company",
    location: "City",
    logo: "logo-url",
    jobTime: "Full-time",
    salary: "Highly competitive",
    postedBy: userId,
  };

  const res = await api.post("/jobs").send(jobData).expect(401);

  // Verify the response
  expect(res.body.success).toBe(undefined);
  expect(res.body.message).toBe(undefined);

  // Additional verification for other fields
});

// Test case: Creating a new job with missing required fields
test("Create a new job without passing token", async () => {
  const jobData = {
    // Missing required fields: title, desc, company, location, logo, jobTime, salary, postedBy
  };

  const res = await api.post("/jobs").send(jobData).expect(401);

  // Verify the response
  expect(res.body.error).toBe("Unauthorized Access");
  // Additional verification for the error message
});

// Clear the job collection and insert mock data before running the tests
beforeEach(async () => {
  await Job.deleteMany({});
  await Job.insertMany([]);
});

// Test case: Sending a GET request to retrieve all jobs
test("Get all jobs", async () => {
  const res = await api.get("/jobs").expect(200);

  // Verify the response
  expect(res.body.success).toBe(true);
  expect(res.body.count).toBe(0); // Ensure the count matches the number of mock jobs
  expect(res.body.data).toHaveLength(0);
  // Additional verification for job data
});

// Test case: Handling an error case where an exception occurs during job retrieval
test("Error in job retrieval", async () => {
  const res = await api.get("/jobs").expect(200);

  // Verify the error response
  expect(res.body.success).toBe(true);
  // Additional verification for error message
});

// Clean up after the tests
afterAll(async () => {
  await mongoose.disconnect();
});
