// jshint esversion:6

// * Requiring Modules

require("dotenv").config();
const express = require("express");
const dateTime = require("./dateTime");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const LocalStrategy = require("passport-local").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const session = require("express-session");
const validator = require("email-validator");
const cryptoRandomString = require("crypto-random-string");
const nodemailer = require("nodemailer");

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

mongoose.connect(process.env.MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});

// * MongoDB (Accounts)

const accountSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    active: Boolean,
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

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL:
                "https://homework-agenda.herokuapp.com/auth/google/home",
            userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
        },
        (accessToken, refreshToken, profile, cb) => {
            console.log(profile);

            Account.findOrCreate({ googleId: profile.id }, (err, user) => {
                return cb(err, user);
            });
        }
    )
);

// * MongoDB (Subject Page)

const subjectSchema = new mongoose.Schema({
    subject: {
        id: String,
        subjectNames: {
            type: String,
            required: true,
        },
    },
});

const Subject = new mongoose.model("Subject", subjectSchema);

// * MongoDB (Item List Page)

const itemListSchema = new mongoose.Schema({
    parentSubjectName: String,
    parentSubjectId: String,
    subjectTitleName: { type: String, required: true },
    subjectBodyName: String,
    subjectFooterName: String,
});

const ItemList = new mongoose.model("Item", itemListSchema);

// * MongoDB (Verification Page)

const verifySchema = new mongoose.Schema({
    code: String,
    userId: String,
    dateCreated: {
        type: Date,
        default: Date.now(),
        expires: 600,
    },
});

const VerificationCode = new mongoose.model("VerificationCodes", verifySchema);

// * Root Route

app.get("/", (req, res) => {
    res.render("index");
});

// * Google OAuth

app.get(
    "/auth/google/",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get(
    "/auth/google/home",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        res.redirect("/home");
    }
);

// * Verification Route (Route has no issues)

app.route("/verify")
    .get((req, res) => {
        Account.findOne({ _id: req.user.id }, (error, foundAccount) => {
            if (error) {
                console.log(error);
            } else {
                if (foundAccount.active === true) {
                    res.redirect("/home");
                } else {
                    if (req.isAuthenticated()) {
                        res.render("verify", { information: "" });
                    } else {
                        res.redirect("/login");
                    }
                }
            }
        });
    })
    .post((req, res) => {
        const code = cryptoRandomString({
            length: 128,
            type: "url-safe",
        });

        VerificationCode.find({ userId: req.user.id }, (err, foundId) => {
            if (err) {
                console.log(err);
            } else {
                if (foundId.length > 0) {
                    return res.render("verify", { information: "codeExist" });
                } else {
                    const verificationCode = new VerificationCode({
                        code: code,
                        userId: req.user.id,
                    });

                    verificationCode.save((err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            VerificationCode.findOne(
                                { userId: req.user.id },
                                (err, foundCode) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        const baseUrl =
                                            "https://homework-agenda.herokuapp.com";
                                        const transporter = nodemailer.createTransport(
                                            {
                                                service: "gmail",
                                                auth: {
                                                    user: process.env.EMAIL,
                                                    pass: process.env.EMAIL_PWD,
                                                },
                                            }
                                        );
                                        const message = {
                                            from: `Homework Agenda <${process.env.EMAIL}>`,
                                            to: req.user.username,
                                            subject:
                                                "Homework Agenda Verification Code",
                                            html: `<h1 style="color: #161616;">Please follow the link below to verify your account</h1><a href="${baseUrl}/verifyLink/auth/${foundCode.code}" style="display: block; text-decoration: none; font-size: 1rem;">${baseUrl}/verifyLink/auth/${foundCode.code}</a><p style="font-size: 0.8rem;">This link expires in <strong>10 minutes</strong></p>`,
                                        };
                                        transporter.sendMail(
                                            message,
                                            (err, info) => {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    return res.render(
                                                        "verify",
                                                        {
                                                            information:
                                                                "newLinkSent",
                                                        }
                                                    );
                                                }
                                            }
                                        );
                                    }
                                }
                            );
                        }
                    });
                }
            }
        });
    });

// * Verify Link Route (Route has no issues)

app.get("/verifyLink/auth/:authLink", (req, res) => {
    const authLink = req.params.authLink;

    VerificationCode.findOne({ code: authLink }, (err, foundCode) => {
        if (err) {
            console.log(err);
        } else {
            if (!foundCode) {
                res.send("Verification Link is expired");
            } else {
                Account.updateOne(
                    { _id: foundCode.userId },
                    { active: "true" },
                    (err, updateResult) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(updateResult);

                            VerificationCode.findByIdAndDelete(
                                { _id: foundCode._id },
                                (err, result) => {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        console.log(
                                            "Deleted Verification Code"
                                        );

                                        res.redirect("/home");
                                    }
                                }
                            );
                        }
                    }
                );
            }
        }
    });
});

// * Register Route (Route has no issues)

app.route("/register")
    .get((req, res) => {
        res.render("register", { err: "" });
    })
    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;

        Account.findOne({ email: email }, (err, foundEmail) => {
            if (err) {
                console.log(err);
            } else {
                if (validator.validate(email) === false) {
                    res.render("register", {
                        err: "emailValidationErr",
                    });
                } else {
                    Account.register(
                        { username: email, active: false },
                        password,
                        (err, user) => {
                            if (err) {
                                if (err.name === "UserExistsError") {
                                    res.render("register", {
                                        err: "emailErr",
                                    });
                                } else if (
                                    err.name === "MissingUsernameError"
                                ) {
                                    console.log("MissingUsernameError");
                                    res.redirect("/register");
                                } else if (
                                    err.name === "MissingPasswordError"
                                ) {
                                    console.log("MissingPasswordError");
                                    res.redirect("/register");
                                } else {
                                    console.log(err);
                                    res.redirect("/register");
                                }
                            } else {
                                passport.authenticate("local")(req, res, () => {
                                    const code = cryptoRandomString({
                                        length: 128,
                                        type: "url-safe",
                                    });

                                    const verificationCode = new VerificationCode(
                                        {
                                            code: code,
                                            userId: req.user.id,
                                        }
                                    );

                                    verificationCode.save((err) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            VerificationCode.findOne(
                                                {
                                                    userId: req.user.id,
                                                },
                                                (err, foundCode) => {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        const baseUrl =
                                                            "https://homework-agenda.herokuapp.com";

                                                        const transporter = nodemailer.createTransport(
                                                            {
                                                                service:
                                                                    "gmail",
                                                                auth: {
                                                                    user:
                                                                        process
                                                                            .env
                                                                            .EMAIL,
                                                                    pass:
                                                                        process
                                                                            .env
                                                                            .EMAIL_PWD,
                                                                },
                                                            }
                                                        );

                                                        const message = {
                                                            from: `Homework Agenda <${process.env.EMAIL}>`,
                                                            to:
                                                                req.user
                                                                    .username,
                                                            subject:
                                                                "Homework Agenda Verification Code",
                                                            html: `<h1 style="color: #161616;">Please follow the link below to verify your account</h1><a href="${baseUrl}/verifyLink/auth/${foundCode.code}" style="display: block; text-decoration: none; font-size: 1rem;">${baseUrl}/verifyLink/auth/${foundCode.code}</a><p style="font-size: 0.8rem;">This link expires in <strong>10 minutes</strong></p>`,
                                                        };

                                                        transporter.sendMail(
                                                            message,
                                                            (err, info) => {
                                                                if (err) {
                                                                    console.log(
                                                                        err
                                                                    );
                                                                } else {
                                                                    console.log(
                                                                        info
                                                                    );

                                                                    res.redirect(
                                                                        "/home"
                                                                    );
                                                                }
                                                            }
                                                        );
                                                    }
                                                }
                                            );
                                        }
                                    });
                                });

                                if (req.statusCode === 401) {
                                    console.log("Error code: 401");
                                    res.redirect("/register");
                                }
                            }
                        }
                    );
                }
            }
        });
    });

// * Login Route (Route has no issues)

app.route("/login")
    .get((req, res) => {
        res.render("login", { err: "" });
    })

    .post((req, res, next) => {
        passport.authenticate("local", (err, user, info) => {
            if (err) {
                if (err === "MissingUsernameError") {
                    console.log("MissingUsernameError");
                    res.redirect("/register");
                }
                return next(err);
            }

            if (!user) {
                return res.render("login", { err: "emailOrPasswordErr" });
            }

            req.login(user, (loginErr) => {
                if (loginErr) {
                    return next(loginErr);
                }

                Account.findOne({ _id: req.user.id }, (err, foundAccount) => {
                    if (err) {
                        console.log(err);
                    } else {
                        if (foundAccount.active === true) {
                            res.redirect("/home");
                        } else {
                            const code = cryptoRandomString({
                                length: 128,
                                type: "url-safe",
                            });

                            const verificationCode = new VerificationCode({
                                code: code,
                                userId: req.user.id,
                            });

                            verificationCode.save((err) => {
                                if (err) {
                                    console.log(err);
                                } else {
                                    VerificationCode.findOne(
                                        {
                                            userId: req.user.id,
                                        },
                                        (err, foundCode) => {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                const baseUrl =
                                                    "https://homework-agenda.herokuapp.com";

                                                const transporter = nodemailer.createTransport(
                                                    {
                                                        service: "gmail",
                                                        auth: {
                                                            user:
                                                                process.env
                                                                    .EMAIL,
                                                            pass:
                                                                process.env
                                                                    .EMAIL_PWD,
                                                        },
                                                    }
                                                );

                                                const message = {
                                                    from: `Homework Agenda <${process.env.EMAIL}>`,
                                                    to: req.user.username,
                                                    subject:
                                                        "Homework Agenda Verification Code",
                                                    html: `<h1 style="color: #161616;">Please follow the link below to verify your account</h1><a href="${baseUrl}/verifyLink/auth/${foundCode.code}" style="display: block; text-decoration: none; font-size: 1rem;">${baseUrl}/verifyLink/auth/${foundCode.code}</a><p style="font-size: 0.8rem;">This link expires in <strong>10 minutes</strong></p>`,
                                                };

                                                transporter.sendMail(
                                                    message,
                                                    (err, info) => {
                                                        if (err) {
                                                            console.log(err);
                                                        } else {
                                                            console.log(info);
                                                            res.redirect(
                                                                "/home"
                                                            );
                                                        }
                                                    }
                                                );
                                            }
                                        }
                                    );
                                }
                            });
                        }
                    }
                });
            });
        })(req, res, next);
    });

// * Home Route (Route has no issues)

app.route("/home")
    .get((req, res) => {
        if (req.isAuthenticated()) {
            Account.findOne({ _id: req.user.id }, (error, foundAccount) => {
                if (error) {
                    console.log(error);
                } else {
                    if (foundAccount.active === false) {
                        res.redirect("/verify");
                    } else {
                        Account.find({}, (err, accountId) => {
                            if (err) {
                                console.log(err);
                            } else {
                                Subject.find(
                                    { "subject.id": req.user.id },
                                    (error, foundSubjects) => {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            let subjectArr = [];

                                            foundSubjects.forEach(
                                                (subjects) => {
                                                    subjectArr.push(subjects);
                                                }
                                            );

                                            res.render("home", {
                                                currentDate: dateTime.currentDate(),
                                                weekday: dateTime.weekday(),
                                                newSubjectItems: subjectArr,
                                            });
                                        }
                                    }
                                );
                            }
                        });
                    }
                }
            });
        } else {
            res.redirect("/login");
        }
    })

    .post((req, res) => {
        const subject = req.body.newSubject;

        const subjectItem = new Subject({
            subject: {
                id: req.user.id,
                subjectNames: subject,
            },
        });

        subjectItem.save((err) => {
            if (err) {
                if (err._message === "Subject validation failed") {
                    res.redirect("/home");
                }

                console.log(err);
            } else {
                res.redirect("/home");
            }
        });
    });

// * /deleteSubject Route (Route fixed)

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

app.route("/home/subjects/:id")
    .get((req, res) => {
        if (req.isAuthenticated()) {
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
                                Subject.find(
                                    { "subject.id": req.user.id },
                                    (err, foundSubjects) => {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            res.render("itemsList", {
                                                weekday: dateTime.weekday(),
                                                subject:
                                                    foundSubject.subject
                                                        .subjectNames,
                                                subjectId: subjectId,
                                                newListItems: foundItemList,
                                                newSubjectItems: foundSubjects,
                                            });
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            });
        } else {
            res.redirect("/login");
        }
    })

    .post((req, res) => {
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
                        if (err._message === "Item validation failed") {
                            res.redirect("/home");
                        }

                        console.log(err);
                    } else {
                        res.redirect("/home/subjects/" + req.params.id);
                    }
                });
            }
        });
    });

// * Delete Item Route (Route has no issues)

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

// * Subject Items Route (Route fixed)

app.get("/home/subjects/items/:listItemId", (req, res) => {
    if (req.isAuthenticated()) {
        const listItemId = req.params.listItemId;

        ItemList.findOne({ _id: listItemId }, (err, foundItem) => {
            if (err) {
                console.log(err);
            } else {
                Subject.find(
                    { "subject.id": req.user.id },
                    (err, foundSubjects) => {
                        if (err) {
                            console.log(err);
                        } else {
                            res.render("listItemFull", {
                                foundItem: foundItem,
                                newSubjectItems: foundSubjects,
                            });
                        }
                    }
                );
            }
        });
    } else {
        res.redirect("/login");
    }
});

// * Logout (Route has no issues)

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

// * Others

app.listen(process.env.PORT || 3000, () => {
    console.log("Listening on port 3000");
});
