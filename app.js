// jshint esversion:6

// * Requiring Modules

const express = require("express");
const _ = require("lodash");
const dateTime = require("./dateTime");

// * Mongoose

const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/homeworkAgenda", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// * Express.js

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

// * Root Route

const subjectSchema = new mongoose.Schema({
    subjectNames: String,
    linkHref: String,
});

const Subject = new mongoose.model("Subject", subjectSchema);

// Global Variables

app.get("/", (req, res) => {
    Subject.find({}, (err, foundSubjects) => {
        if (err) {
            console.log(err);
        } else {
            console.log(foundSubjects);

            res.render("home", {
                currentDate: dateTime.currentDate(),
                weekday: dateTime.weekday(),
                newSubjectItems: foundSubjects,
            });
        }
    });
});

app.post("/", (req, res) => {
    const subject = req.body.subject;

    const newSubject = new Subject({
        subjectNames: _.upperFirst(subject),
        linkHref: _.kebabCase(subject),
    });

    newSubject.save((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully added to database");
        }
    });

    res.redirect("/");
});

// Others

app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
});
