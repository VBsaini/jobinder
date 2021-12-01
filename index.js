require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const middlewareObj = require("./middleware/index");
const flash = require("connect-flash");
const nodemailer = require("nodemailer");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/assets", express.static(__dirname + "/assets"));
app.use(
    require("express-session")({
        secret: "father needs a pc",
        resave: false,
        saveUninitialized: false,
    })
);
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});
app.use(passport.initialize());
app.use(passport.session());
mongoose
    .connect("mongodb+srv://joninderKRG:" + process.env.MONGOPASSWORD + "@jobinder.zfdyg.mongodb.net/myFirstDatabase?retryWrites=true&w=majority")
    .catch((error) => console.log(error));

const jobsSchema = new mongoose.Schema({
    title: String,
    designation: String,
    salaryMin: Number,
    salaryMax: Number,
    location: String,
    qualification: [String],
    timeStart: String,
    timeEnd: String,
});
var UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, required: true },
});
UserSchema.plugin(passportLocalMongoose);
const jobs = mongoose.model("jobs", jobsSchema);
const User = mongoose.model("User", UserSchema);

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",  (req, res) => {
    if (req.user) {
        res.render("home", { user: req.user });
    } else {
        res.redirect("/login");
    }
});
app.post("/email", middlewareObj.isloggedin, (req, res) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });

    User.findOne({ username: req.user.username }, (err, user) => {
        if (err) {
            res.redirect("/home");
        } else {
            let mailOptions = {
                from: "helpjobinder@gmail.com",
                to: "helpjobinder@gmail.com",
                subject: `message from ${req.user.username}`,
                text: `${req.body.message} - ${user.email}`,
            };
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    req.flash("error", "error please try again later");
                    res.redirect("/");
                } else {
                    req.flash("success", "Email sent");
                    res.redirect("/");
                }
            });
        }
    });
});
app.get("/specificJobs", middlewareObj.isloggedin, (req, res) => {
    jobs.find(
        {
            $and: [
                {
                    $and: [
                        { title: req.query.company || { $exists: true } },
                        {
                            designation: req.query.position || {
                                $exists: true,
                            },
                        },
                    ],
                },
                { salaryMin: { $gte: req.query.salaryMin } },
                { salaryMax: { $lte: req.query.salaryMax } },
            ],
        },
        (err, data) => {
            let start = req.app.locals.start;
            let end = req.app.locals.end;
            let numOfIndex = req.app.locals.numOfIndex;
            let totalNum = req.app.locals.totalNum;
            let next = true;
            let previous = false;
            if (
                start == undefined &&
                end == undefined &&
                totalNum == undefined
            ) {
                req.app.locals.start = 0;
                req.app.locals.end = 10;
                req.app.locals.totalNum = Math.floor(data.length / 10);
                req.app.locals.numOfIndex = 0;
                start = req.app.locals.start;
                end = req.app.locals.end;
                totalNum = req.app.locals.totalNum;
            }
            if (numOfIndex >= totalNum) {
                next = false;
            }
            if (numOfIndex <= 0) {
                previous = false;
            } else {
                previous = true;
            }
            if (err) {
                req.flash("error", "error occured");
                res.redirect("/alljobs");
            } else {
                res.render("alljobs", {
                    data: data,
                    user: req.user,
                    start: start,
                    end: end,
                    next: next,
                    previous: previous,
                });
            }
        }
    );
});
app.get("/login", (req, res) => {
    res.render("login");
});

app.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        successFlash: "Succesfully Logged in",
        failureFlash: true,
    }),
    function (req, res) {}
);
app.get("/user", middlewareObj.isAdmin, (req, res) => {
    User.find({}, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            res.send(data);
        }
    });
});

app.get("/alljobs", middlewareObj.isloggedin, (req, res) => {
    jobs.find({}, (err, data) => {
        if (err) {
            req.flash("error", "error occured");
            res.redirect("/login");
        }
        let start = req.app.locals.start;
        let next = true;
        let previous = false;
        let end = req.app.locals.end;
        let numOfIndex = req.app.locals.numOfIndex;
        let totalNum = req.app.locals.totalNum;
        if (start == undefined && end == undefined) {
            req.app.locals.start = 0;
            req.app.locals.end = 10;
            req.app.locals.totalNum = Math.floor((data.length - 1) / 10);
            req.app.locals.numOfIndex = 0;
            start = req.app.locals.start;
            end = req.app.locals.end;
            
        numOfIndex = req.app.locals.numOfIndex;
        totalNum = req.app.locals.totalNum;
        }
        if (numOfIndex >= totalNum) {
            next = false;
        } else {
            next= true
        }
        if (numOfIndex <= 0) {
            previous = false;
        } else {
            previous = true;
        }
        res.render("allJobs", {
            data: data,
            user: req.user,
            start: start,
            end: end,
            next: next,
            previous: previous,
        });
    });
});
app.post("/email/apply/:id", middlewareObj.isloggedin, (req, res) => {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD,
        },
    });
    jobs.findById(req.params.id, (err, data) => {
        if (err) {
            req.flash("error", "error please try again later");
            res.redirect("back");
        } else {
            let mailOptions = {
                from: "helpjobinder@gmail.com",
                to: "helpjobinder@gmail.com",
                subject: `message from ${req.body.fName}`,
                text: `address - ${req.body.address}
                        email - ${req.body.email}
                        number - ${req.body.number}
                        job - ${data.title}, ${data.designation}
                        job_id - ${data._id}`,
            };
            transporter.sendMail(mailOptions, (err, data) => {
                if (err) {
                    req.flash("error", "error please try again later");
                    res.redirect("/");
                } else {
                    req.flash(
                        "success",
                        "Applied. our Team will contact you soon"
                    );
                    res.redirect("/");
                }
            });
        }
    });
});
app.get("/next", middlewareObj.isloggedin, (req, res) => {
    if (!(req.app.locals.numOfIndex >= req.app.locals.totalNum)) {
        req.app.locals.start += 10;
        req.app.locals.end += 10;
        req.app.locals.numOfIndex += 1;
    }
    res.redirect("/alljobs");
});

app.get("/previous", middlewareObj.isloggedin, (req, res) => {
    if (!(req.app.locals.numOfIndex <= 0)) {
        req.app.locals.start -= 10;
        req.app.locals.end -= 10;
        req.app.locals.numOfIndex -= 1;
    }
    res.redirect("/alljobs");
});

app.get("/logout", (req, res) => {
    req.logOut();
    res.redirect("/login");
});
app.get("/createjob", middlewareObj.isAdmin, (req, res) => {
    var EditJob = req.app.locals.EditJob;
    req.app.locals.EditJob = null;
    res.render("createJob", { user: req.user, EditJob: EditJob });
});
app.post("/user/:method/:id", middlewareObj.isloggedin, (req, res) => {
    if (req.params.method == "password") {
        User.findById(req.params.id, (err, data) => {
            if (err) {
                req.flash("error", "please try again later");
                res.redirect("/alljobs");
            } else {
                data.changePassword(
                    req.body.oldpassword,
                    req.body.newpassword,
                    (err, data) => {
                        if (err) {
                            req.flash(
                                "error",
                                "the password you entered is incorrect"
                            );
                            res.redirect("/alljobs");
                        } else {
                            req.flash(
                                "success",
                                "password changed successfully"
                            );
                            res.redirect("/alljobs");
                        }
                    }
                );
            }
        });
    } else if (req.params.method == "username") {
        User.findByIdAndUpdate(
            req.params.id,
            { $set: { username: req.body.username } },
            (err, data) => {
                if (err) {
                    if (err.codeName == "DuplicateKey") {
                        req.flash("error", "Username is already taken");
                        res.redirect("/alljobs");
                    } else {
                        req.flash("error", "please try again later");
                        res.redirect("/login");
                    }
                } else {
                    req.flash("success", "Username changed successfully");
                    res.redirect("/login");
                }
            }
        );
    } else if (req.params.method == "email") {
        User.findByIdAndUpdate(
            req.params.id,
            { $set: { email: req.body.email } },
            (err, data) => {
                if (err) {
                    if (err.codeName == "DuplicateKey") {
                        req.flash("error", "The email is already taken");
                        res.redirect("/login");
                    } else {
                        req.flash("error", "please try again later");
                        res.redirect("/login");
                    }
                } else {
                    req.flash("success", "Email changed successfully");
                    res.redirect("/alljobs");
                }
            }
        );
    } else {
        res.redirect("back");
    }
});
app.get("/signup", (req, res) => {
    res.render("signUp");
});
app.post("/forgotpassword", (req, res) => {
    User.findOne(
        { username: req.body.username, email: req.body.email },
        (err, user) => {
            if (err) {
                req.flash("error", "please try again later");
                res.redirect("/login");
            } else {
                if (user) {
                    user.setPassword(req.body.password, function (err, user) {
                        if (err) {
                            req.flash("error", "please try again later");
                            res.redirect("/login");
                        } else {
                            user.save();
                            req.flash(
                                "success",
                                "password successfully changed"
                            );
                            res.redirect("/login");
                        }
                    });
                } else {
                    req.flash("error", "username or email is incorrect");
                    res.redirect("/login");
                }
            }
        }
    );
});
app.post("/jobs", middlewareObj.isloggedin, (req, res) => {
    qualificationArray = req.body.qualification.split(" + ");
    jobs.create(
        {
            title: req.body.title,
            designation: req.body.pos,
            salaryMin: req.body.smin,
            salaryMax: req.body.smax,
            location: req.body.loc,
            qualification: qualificationArray,
            timeStart: req.body.timeS,
            timeEnd: req.body.timeE,
        },
        (err, data) => {
            if (err) {
                req.flash("error", "please try again later");
            } else {
                req.flash("success", "job created successfully");
            }
        }
    );
    res.redirect("/alljobs");
});
app.get("/jobs/edit/:id", middlewareObj.isAdmin, (req, res) => {
    jobs.findById(req.params.id, (err, data) => {
        if (err) {
            req.flash("error", "Please try again later");
        } else {
            if (data) {
                req.app.locals.EditJob = data;
                res.redirect("/createjob");
            } else {
                res.redirect("/alljobs");
            }
        }
    });
});
app.post("/jobs/edit/:id", (req, res) => {
    qualificationArray = req.body.qualification.split(" + ");
    jobs.findByIdAndUpdate(
        req.params.id,
        {
            $set: {
                title: req.body.title,
                designation: req.body.pos,
                salaryMin: req.body.smin,
                salaryMax: req.body.smax,
                qualification: qualificationArray,
                location: req.body.loc,
                timeStart: req.body.timeS,
                timeEnd: req.body.timeE,
            },
        },
        (err, data) => {
            if (err) {
                req.flash("error", "please try again later");
                res.redirect("/alljobs");
            } else {
                req.flash("success", "Job changed successfully");
                res.redirect("/alljobs");
            }
        }
    );
});
app.post("/jobs/:id", middlewareObj.isAdmin, (req, res) => {
    jobs.findByIdAndDelete(req.params.id, (err, data) => {
        if (err) {
            req.flash("error", "please try again later");
        } else {
            req.flash("success", "job deleted successfully");
            res.redirect("/alljobs");
        }
    });
});
app.post("/signup", function (req, res) {
    if (req.body.password != req.body.conPassword) {
        req.flash("error", "Password and confirm Password do not match");
        res.redirect("back");
    }
    var newuser = new User({
        username: req.body.username,
        email: req.body.email,
    });
    User.register(newuser, req.body.password, function (err, user) {
        if (err) {
            if (err.code == 11000) {
                req.flash("error", "email is already taken");
            } else {
                req.flash("error", err.message);
            }
            return res.redirect("/signup");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "welcome to Jobinder " + user.username);
            res.redirect("/");
        });
    });
});
app.get("/job/:id", middlewareObj.isloggedin, (req, res) => {
    jobs.findById(req.params.id, (err, data) => {
        if (err) {
            req.flash("error", "error occured");
            res.redirect("/alljobs");
        }
        res.render("specificJob", { data: data, user: req.user });
    });
});

app.get("*", (req, res) => {
    res.redirect("/login");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("connected");
});
