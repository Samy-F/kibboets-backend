const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const pinRoute = require("./routes/pins");
const userRoute = require("./routes/users");
const koerierRoute = require("./routes/koeriers");
const { ordersRoute } = require("./routes/orders");
const koerierData = require("./routes/koerierData");
var cors = require("cors");

let port = process.env.PORT || 8800;

const app = express();
dotenv.config();

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Mongodb connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use("/api/pins", pinRoute);
app.use("/api/users", userRoute);
app.use("/api/v1/orders", ordersRoute);
app.use("/api/v1/koeriers", koerierRoute);
app.use("/api/v1/data", koerierData);

app.listen(port, () => {
  console.log("App is listening on port: " + port);
});
