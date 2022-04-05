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
  var axios = require("axios");

  var config = {
    method: "get",
    url: "https://api.foodticket.net/1/orders?sdate_start=2021-03-04&sdate_end=2021-03-05",
    headers: {
      "X-OrderBuddy-Client-Id": "5704",
      "X-OrderBuddy-API-Key": "91ee337266ee0790e95a20bd5793c4dd",
    },
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      res.send("response");
    })
    .catch(function (error) {
      console.log(error);
      res.send("axios error");
    });
});

app.use("/api/pins", pinRoute);
app.use("/api/users", userRoute);
app.use("/api/v1/orders", ordersRoute);
app.use("/api/v1/koeriers", koerierRoute);
app.use("/api/v1/data", koerierData);

app.listen(port, () => {
  console.log("App is listening on port: " + port);
});
