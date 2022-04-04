const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const pinRoute = require("./routes/pins");
const userRoute = require("./routes/users");
const koerierRoute = require("./routes/koeriers");
const { ordersRoute } = require("./routes/orders");
const koerierData = require("./routes/koerierData");

let port = process.env.PORT || 8800;

const app = express();
dotenv.config();

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.send("hello world");
});

app.use("/api/pins", pinRoute);
app.use("/api/users", userRoute);
app.use("/api/v1/orders", ordersRoute);
app.use("/api/v1/koeriers", koerierRoute);
app.use("/api/v1/data", koerierData);

app.listen(port, () => {
  console.log("App is listening on port: " + port);
});
