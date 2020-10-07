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
    useFindAndModify: false,
});

// * Express.js

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

// * MongoDB (Subject Page)

const subjectSchema = new mongoose.Schema({
    subjectNames: String,
});

const Subject = new mongoose.model("Subject", subjectSchema);

// * MongoDB (Item List Page)

const itemListSchema = new mongoose.Schema({
    parentSubjectName: String,
    parentSubjectId: String,
    subjectTitleName: String,
    subjectBodyName: String,
    subjectFooterName: String,
});

const ItemList = new mongoose.model("Item", itemListSchema);

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
        subjectNames: subject,
    });

    subjectItem.save((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

// * /deleteSubject Route

app.post("/deleteSubject", (req, res) => {
    const subjectDeleteId = req.body.subjectDeleteCheckbox;

    Subject.findOne({ _id: subjectDeleteId }, (err, foundSubject) => {
        if (err) {
            console.log(err);
        } else {
            ItemList.deleteMany(
                { parentSubjectId: foundSubject._id },
                (err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        Subject.deleteOne({ _id: subjectDeleteId }, (err) => {
                            if (err) {
                                console.log(err);
                            } else {
                                res.redirect("/");
                            }
                        });
                    }
                }
            );
        }
    });
});

// * Route Parameters (Subjects)

app.get("/subjects/:id", (req, res) => {
    const subjectId = req.params.id;

    Subject.findOne({ _id: subjectId }, (err, foundSubject) => {
        if (err) {
            console.log(err);
        } else {
            ItemList.find(
                { parentSubjectId: foundSubject._id },
                (err, foundItemList) => {
                    if (err) {
                        console.log(err);
                    } else {
                        res.render("itemsList", {
                            weekday: dateTime.weekday(),
                            subject: foundSubject.subjectNames,
                            subjectId: subjectId,
                            newListItems: foundItemList,
                        });
                    }
                }
            );
        }
    });
});

app.post("/subjects/:id", (req, res) => {
    const newItemTitle = req.body.subjectItemTitle;
    const newItemBody = req.body.subjectItemBody;
    const newItemFooter = req.body.subjectItemFooter;

    Subject.findOne({ _id: req.params.id }, (err, foundSubject) => {
        if (err) {
            console.log(err);
        } else {
            const listItem = new ItemList({
                parentSubjectName: foundSubject.subjectNames,
                parentSubjectId: foundSubject._id,
                subjectTitleName: newItemTitle,
                subjectBodyName: newItemBody,
                subjectFooterName: newItemFooter,
            });

            listItem.save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/subjects/" + req.params.id);
                }
            });
        }
    });
});

// * Subject Items Route

app.get("/subjects/items/:listItemId", (req, res) => {
    const listItemId = req.params.listItemId;

    ItemList.findOne({ _id: listItemId }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            res.render("listItemFull", {
                foundItem: foundItem,
            });
        }
    });
});

// * Others

app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
});
