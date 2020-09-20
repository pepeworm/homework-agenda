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

// * MongoDB (Subject Page)

const subjectSchema = new mongoose.Schema({
    subjectNames: String,
    linkHref: String,
});

const Subject = new mongoose.model("Subject", subjectSchema);

// * Root Route

app.get("/", (req, res) => {
    Subject.find({}, (err, foundSubjects) => {
        if (err) {
            console.log(err);
        } else {
            res.render("home", {
                currentDate: dateTime.currentDate(),
                weekday: dateTime.weekday(),
                newSubjectItems: foundSubjects,
            });
        }
    });
});

app.post("/", (req, res) => {
    const subject = req.body.newSubject;

    const subjectItem = new Subject({
        subjectNames: _.upperFirst(subject),
        linkHref: `${_.kebabCase(subject)}-${_.uniqueId("subject_")}`,
    });

    subjectItem.save();

    res.redirect("/");
});

// * /deleteSubject Route

app.post("/deleteSubject", (req, res) => {
    const subjectDeleteId = req.body.subjectDeleteCheckbox;

    Subject.deleteOne({ _id: subjectDeleteId }, (err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

// * Others

app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
});
