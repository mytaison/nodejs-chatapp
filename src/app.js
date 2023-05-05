const express = require("express")
const path = require("path")

const app = express()


// Public Directory
const publicDirectoryPath = path.join(__dirname, "../public")
app.use(express.static(publicDirectoryPath))

module.exports = app