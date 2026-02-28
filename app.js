var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const { con } = require("./db");

var { router: his, upload } = require("./routes/HisRoutes");
<<<<<<< HEAD
const { router:inventory } = require("./routes/InventoryRoutes");
const { router:billing } = require("./routes/BillingRoutes");
=======
const { router: inventory } = require("./routes/InventoryRoutes");
const { router: billing } = require("./routes/BillingRoutes");
const { router: embryology } = require("./routes/embryology.routes");
>>>>>>> 15d431a (Added new features in Kamakhya_dev branch)
const {
  verifyToken,
  savePatientData,
} = require("./controllers/HisControllers");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/PatientQrReg", function (req, res, next) {
  res.render("HIS/PatientQrReg");
});
app.post("/patient-qreg", upload.single("patientImage"), savePatientData);

app.use((req, res, next) => {
  // Allow POST requests to /logoutFromEverywhere and all requests to /login
  if (
    (req.method === "POST" && req.path === "/logoutFromEverywhere") ||
    req.path === "/login"
  ) {
    return next();
  }

  // For all other routes, verify the token
  return verifyToken(req, res, next);
});

app.use("/", his);
app.use("/inventory", inventory);
<<<<<<< HEAD
app.use("/billing",billing );
=======
app.use("/billing", billing);
app.use("/embryology", embryology);
>>>>>>> 15d431a (Added new features in Kamakhya_dev branch)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});
<<<<<<< HEAD

=======
>>>>>>> 15d431a (Added new features in Kamakhya_dev branch)
const PORT = 5001;
app.listen(PORT, async () => {
  console.log(`Server started at PORT ${PORT}`);
  await con();
});
<<<<<<< HEAD

=======
>>>>>>> 15d431a (Added new features in Kamakhya_dev branch)
module.exports = app;
