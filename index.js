const express = require("express");
const cors = require("cors");
const mongoose = require("./db.js");
const compression = require("compression");
const bodyParser = require("body-parser");
const { cloudinaryConfig } = require("./config/cloudinaryConfig");
const fileupload = require("express-fileupload");
require("dotenv").config();

//Routers
const compliantRouter = require("./routes/services/CompliantControllerRoute");
const CompliantUserRoute = require("./routes/services/CompliantUserControllerRoute");
const userRouter = require("./routes/accounts/AuthControllerRoute");
const accountsRouter = require("./routes/accounts/AccountsControllerRoute");
const cookieParser = require("cookie-parser");
//end-routers

const app = express();
const port = process.env.PORT || 3000;

const csrf = require("csurf");
const corsOptions = {
  origin: "https://complaint-web.herokuapp.com", //"http://localhost:8080",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(compression({ filter: shouldCompress }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileupload({ useTempFiles: true }));

app.use(cookieParser());
app.use(csrf({ cookie: true }));

// file service
app.use(cloudinaryConfig);

// uses
app.use(compliantRouter);
app.use(CompliantUserRoute);
app.use(userRouter);
app.use(accountsRouter);
// end-uses

app.listen(port, () => {
  console.log("Server is running... at port " + port);
});

function shouldCompress(req, res) {
  return compression.filter(req, res);
}

module.exports = app;
