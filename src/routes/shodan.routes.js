const express = require("express");
const shodanController = require("../controllers/shodan.controller");

const router = express.Router();

// GET /api/v1/shodan/search?q=<query>&page=1&size=10
router.get("/search", shodanController.searchHosts);

// GET /api/v1/shodan/host/:ip
router.get("/host/:ip", shodanController.getHostInfo);

module.exports = router;
