// jshint esversion:6

// * Requiring Modules

require("dotenv").config();
const express = require("express");
const _ = require("lodash");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const dateTime = require("./dateTime");

// * Mongoose

const mongoose = require("mongoose");

mongoose.connect(
    "mongodb://localhost:27017/homeworkAgenda",
    // "mongodb+srv://admin-pepeworm:pepeworm@cluster0.v8jsq.mongodb.net/homeworkAgenda",
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    }
);

// * Express.js

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

// * MongoDB (Accounts)

const accountSchema = new mongoose.Schema({
   email: String,
   password: String, 
});

const Account = new mongoose.model("Account", accountSchema);

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
    res.render("index");
});

// * Register Route

app.route("/register")
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        const email = req.body.email;
        const password = req.body.password;

        console.log(email, password);
        res.redirect("/register");
    });

// * Login Route

app.get("/login", (req, res) => {
    res.render("login");
});

// * Home Route

app.route("/home")
    .get((req, res) => {
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
    })

    .post((req, res) => {
        const subject = req.body.newSubject;

        const subjectItem = new Subject({
            subjectNames: subject,
        });

        subjectItem.save((err) => {
            if (err) {
                console.log(err);
            } else {
                res.redirect("/home");
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
                                res.redirect("/home");
                            }
                        });
                    }
                }
            );
        }
    });
});

// * Route Parameters (Subjects)

app.route("/home/subjects/:id").get((req, res) => {
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
                        Subject.find({}, (err, foundSubjects) => {
                            if (err) {
                                console.log(err);
                            } else {
                                res.render("itemsList", {
                                    weekday: dateTime.weekday(),
                                    subject: foundSubject.subjectNames,
                                    subjectId: subjectId,
                                    newListItems: foundItemList,
                                    newSubjectItems: foundSubjects,
                                });
                            }
                        });
                    }
                }
            );
        }
    });
});

app.post("/home/subjects/:id", (req, res) => {
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
                    res.redirect("/home/subjects/" + req.params.id);
                }
            });
        }
    });
});

app.post("/deleteItem", (req, res) => {
    const itemDeleteId = req.body.listItemDelete;
    const itemDeleteParentId = req.body.listItemParentId;

    ItemList.deleteOne({ _id: itemDeleteId }, (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("Successfully deleted item");

            res.redirect("/home/subjects/" + itemDeleteParentId);
        }
    });
});

// * Subject Items Route

app.get("/home/subjects/items/:listItemId", (req, res) => {
    const listItemId = req.params.listItemId;

    ItemList.findOne({ _id: listItemId }, (err, foundItem) => {
        if (err) {
            console.log(err);
        } else {
            Subject.find({}, (err, foundSubjects) => {
                if (err) {
                    console.log(err);
                } else {
                    res.render("listItemFull", {
                        foundItem: foundItem,
                        newSubjectItems: foundSubjects,
                    });
                }
            });
        }
    });
});

// * Others

app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
});
