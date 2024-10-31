// express config
const express = require("express");
const app = express();

// dot env config
require("dotenv").config();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// mongodb connection
let { connectDB } = require("./db/connection");

// cors
const cors = require("cors");
app.use(
  cors({ credentials: true, origin: "http://localhost:3000" })
);

// parsing the cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// handling files
// const fileupload = require("express-fileupload");
// app.use(fileupload({ useTempFiles: true, tempFileDir: "/temp/" }));

const PORT = process.env.PORT || 4000;

app.get("/", (req, res) => {
  res.send("Hello");
});

// establishing connestion to database

const connect = async () => {
  try {
    await connectDB();
    let server = app.listen(PORT, () => {
      console.log(`App is running @ ${PORT}`);
    });
    return server;
  } catch (err) {
    console.log(err);
  }
};

connect();