const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const router = express.Router();
const Job = require("../models/jobModel");

async function search(req, res) {
  console.log("INSIDE search function");
  try {
    const searchQuery = req.params.query;
    console.log(searchQuery);
    // Find jobs that have the search query in any of the relevant fields
    const jobs = await Job.find({
      $or: [
        { title: { $regex: searchQuery, $options: "i" } },
        { desc: { $regex: searchQuery, $options: "i" } },
        { company: { $regex: searchQuery, $options: "i" } },
        { location: { $regex: searchQuery, $options: "i" } },
        { jobTime: { $regex: searchQuery, $options: "i" } },
        { salary: { $regex: searchQuery, $options: "i" } },
      ],
    });
    console.log(jobs);
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error in search" });
  }
}

async function filterCompanyName(req, res) {
  console.log("in filterCompanYName");
  try {
    const c = req.body.c;
    const j = req.body.j;
    const l = req.body.l;
    const jo = req.body.jo;
    console.log(c);
    console.log(l);
    console.log(jo);
    // Create an empty filter object to store the search criteria
    const filter = {};

    // Add search criteria for companyName if provided
    if (c) {
      filter["company"] = { $regex: c, $options: "i" };
    }

    // Add search criteria for jobTitle if provided
    if (j) {
      filter["title"] = { $regex: j, $options: "i" };
    }

    // Add search criteria for location if provided
    if (l) {
      filter["location"] = { $regex: l, $options: "i" };
    }

    // Add search criteria for jobTime if provided
    if (jo) {
      filter["time"] = { $regex: jo, $options: "i" };
    }

    // Perform the database query with the combined filter object
    const filteredJobs = await Job.find(filter);

    res.json({ success: true, data: filteredJobs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  search,
  filterCompanyName,
};
