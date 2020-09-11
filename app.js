// jshint esversion:6

const express = require("express");
const _ = require("lodash");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
    app.render("index");
});

app.listen(3000, () => {
    console.log("Listening on port 3000");
});
