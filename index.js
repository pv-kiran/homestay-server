// express config
const express = require("express");
const app = express();
const cron = require('node-cron');

// dot env config
require("dotenv").config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// mongodb connection
let { connectDB } = require("./db/connection");

// cors
const cors = require("cors");
app.use(
  cors({ credentials: true, origin: "http://localhost:5173" })
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

const adminRoutes = require("./routes/adminRoute");
const userRoutes = require("./routes/userRoute");
const { sendCheckInReminders } = require("./controllers/adminController");


app.use("/api/admin", adminRoutes);
app.use("/api/user", userRoutes)



cron.schedule('*/1 * * * *', async () => {
  console.log('Cron job started...');
  await sendCheckInReminders()
});



const connect = async () => {
  try {
    await connectDB();
    let server = app.listen(PORT, () => {
      console.log(`Server is running @ ${PORT}`);
    });
    return server;
  } catch (err) {
    console.log(err);
  }
};

connect();