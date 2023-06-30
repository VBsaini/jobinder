var middlewareObj = {};

// middlewareObj.isloggedin = function (req, res, next) {
//     if (req.isAuthenticated()) {
//         return next();
//     }
//     req.flash("error", "please log in or sign up to access that page");
//     res.redirect("/login");
// };

// middlewareObj.isAdmin = (req, res, next) => {
//     if (req.isAuthenticated()) {
//         if (req.user.username == "admin") {
//             return next();
//         } else {
//             req.flash("error", "You don't have access to that page");
//             return res.redirect("/alljobs");
//         }
//     } else {
//         req.flash("error", "please log in or sign up to access that page");
//         return res.redirect("/login");
//     }
// };

module.exports = middlewareObj;
