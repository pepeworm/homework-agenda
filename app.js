// jshint esversion:6

// * Requiring Modules

require("dotenv").config();
const express = require("express");
const _ = require("lodash");
const dateTime = require("./dateTime");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const session = require("express-session");

// * Express.js

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

// * Mongoose

mongoose.connect(
    "mongodb://localhost:27017/homeworkAgenda",
    // process.env.MONGO,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useCreateIndex: true,
    }
);

// * MongoDB (Accounts)

const accountSchema = new mongoose.Schema({
    email: String,
    password: {
        type: String,
        unique: false,
    },
});

accountSchema.plugin(passportLocalMongoose);
accountSchema.plugin(findOrCreate);

const Account = new mongoose.model("Account", accountSchema);

passport.use(Account.createStrategy());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    Account.findById(id, (err, user) => {
        done(err, user);
    });
});

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
        res.render("register", { err: "" });
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;

        Account.register({ username: email }, password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/home");
                });

                if (req.statusCode === 401) {
                    console.log("Error code: 401");
                    res.redirect("/register");
                }
            }
        });
    });

// * Login Route

app.route("/login")
    .get((req, res) => {
        res.render("login", { err: "" });
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;

        Account.findOne({ email: email }, (err, foundEmail) => {
            if (err) {
                console.log(err);
            } else {
                if (!foundEmail) {
                    res.render("login", { err: "emailErr" });
                } else {
                    // bcrypt.compare(
                    //     password,
                    //     foundEmail.password,
                    //     (err, result) => {
                    //         if (err) {
                    //             console.log(err);
                    //         } else {
                    //             if (result === true) {
                    //                 foundEmail.signIn = true;
                    //                 res.redirect("/home");
                    //             } else {
                    //                 res.render("login", { err: "passwordErr" });
                    //             }
                    //         }
                    //     }
                    // );
                }
            }
        });
    });

// * Home Route

app.route("/home")
    .get((req, res) => {
        if (req.isAuthenticated()) {
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
        } else {
            res.redirect("/login");
        }
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
