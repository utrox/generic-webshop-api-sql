// require packages
require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimiter = require("express-rate-limit");
const cors = require("cors");
const xss = require("xss-clean");

// security middlewares
app.set("trust proxy", 1);
// allow only 40 requests per 5 minutes from an adress.
app.use(
  rateLimiter({
    windowMs: 5 * 60 * 1000,
    max: 40,
  })
);
app.use(helmet());
app.use(cors());
app.use(xss());

//middlewares
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/", express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET));

//import routers
const productRouter = require("./routers/productRouter");
const reviewRouter = require("./routers/reviewRouter");
const authRouter = require("./routers/authRouter");

//routes
app.use("/api/v1/products", productRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/auth", authRouter);

app.route("/").get((req, res) => {
  res.send("api is running");
});

// errorhandler and notfound middlewares
const errorHandlerMiddleware = require("./middlewares/error-handler");
const notFoundMiddleware = require("./middlewares/not-found");
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// starting the server
const startServer = () => {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}...`);
  });
};

startServer();
