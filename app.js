const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const colors = require("colors");
const connectDB = require("./config/db");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");
const helmet = require("helmet");
const xss = require("xss-clean");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.options("*", cors());

// Load env file
dotenv.config({
  path: "./config/config.env",
});

// Connect to database
connectDB();

// Route files
const designer = require("./routes/designer");
const consumer = require("./routes/consumer");
const job = require("./routes/job");
const post = require("./routes/post");



// Body parser
app.use(express.json());
app.use(cookieParser());

app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Sanitize data
app.use(mongoSanitize());

// Set security headers
app.use(
  helmet({
    crossOriginResourcePolicy: false, 
  })
);

// Prevent XSS attacks
app.use(xss());

// Set static folder
app.use('/uploads', cors(), express.static('public/uploads')); 
// app.use(express.static(path.join(__dirname, "public")));
// app.use(express.static('public'));

// Mount routers
app.use("/api/v1/designer", designer);
app.use("/api/v1/consumer", consumer);
app.use("/api/v1/job", job);
app.use("/api/v1/post", post);


const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});