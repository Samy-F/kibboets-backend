const router = require("express").Router();
const date = require("date-and-time");
const moment = require("moment");
let axios = require("axios");
var convert = require("xml-js");
const { listeners } = require("../models/Pin");

const getOrders = async (query, res) => {
  console.log(query);
  let driverId = query.driverId;
  let status = query.status;
  let startDate = query.startDate;
  let endDate = query.endDate;
  let format = query.format;
  const now = new Date();

  //get yesterday date
  const yesterday = date.format(date.addDays(now, -1), "YYYY-MM-DD");
  console.log(yesterday);

  //for restaurants that are open at night. It won't reset till 6 am/resetTime

  let resetTime = 6;
  if (now.getHours() < 6) {
    startDate = yesterday;
  }

  !moment(startDate, "YYYY-MM-DD", true).isValid()
    ? (startDate = date.format(now, "YYYY-MM-DD"))
    : startDate;

  !moment(endDate, "YYYY-MM-DD", true).isValid()
    ? (endDate = date.format(now, "YYYY-MM-DD"))
    : endDate;

  let url = `https://api.foodticket.net/1/orders?sdate_start=${startDate}&sdate_end=${endDate}`;
  var config = {
    method: "get",
    url,
    headers: {
      "X-OrderBuddy-Client-Id": "5704",
      "X-OrderBuddy-API-Key": "91ee337266ee0790e95a20bd5793c4dd",
    },
  };

  const axiosRes = await axios(config).catch((err) =>
    console.log("axios error")
  );
  let data = convert.xml2json(axiosRes.data, { compact: true, spaces: 4 });
  let ordersData = JSON.parse(data);
  let orders;

  if (Object.keys(ordersData["orders"]).length !== 0) {
    if (ordersData["orders"]["order"]["id"] === undefined) {
      orders = ordersData["orders"]["order"];
      //   console.log(orders);
    } else {
      orders = [ordersData["orders"]["order"]];
      // console.log(orders);
    }

    //check for query parameters
    if (driverId) {
      orders = orders.filter((order) => {
        return order.deliverer_id._text === driverId;
      });
    }

    //options: init / kitchen / enroute / delivered;
    if (status) {
      orders = orders.filter((order) => {
        return order.status._text === status;
      });
    }

    //formatting the object to the needs
    if (format === "streetnames") {
      orders = orders.map((order) => {
        return {
          address: order.address._text,
          id: order.id._text,
        };
      });
    } else if (format === "koerierData") {
      orders = orders.map((order) => {
        return {
          address: order.address._text,
          id: order.id._text,
        };
      });
    }

    if (orders.length === 0) {
      console.log("driver got no orders");
      orders = [];
    }
    // else {
    //   res.status(200).json(orders);
    // }
  } else {
    orders = [];
    // return res.status(404).json({ message: "no orders available" });
  }

  console.log(
    "------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------"
  );
  return orders;
};

/// Get orders based on status

// Get all orders
router.get("/", async (req, res) => {
  try {
    let orders = await getOrders(req.query, res);
    if (orders === null) {
      return res.status(200).json(orders);
    } else {
      return res.status(200).json(orders);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500);
  }
});

router.patch("/", async (req, res) => {
  try {
    let orderId = req.query.orderId;
    let driverId = req.query.driverId;
    let status = req.query.status;

    let url = `https://api.foodticket.nl/1/orders?id=${orderId}&deliverer_id=${driverId}&status=${status}`;
    console.log(orderId);
    console.log(driverId);
    console.log(status);
    console.log(url);

    var config = {
      method: "patch",
      url,
      headers: {
        "X-OrderBuddy-Client-Id": "5704",
        "X-OrderBuddy-API-Key": "91ee337266ee0790e95a20bd5793c4dd",
      },
    };

    const axiosRes = await axios(config).catch((err) => {
      res
        .status(404)
        .json({ error: err.message, message: "Invalid input", status: 404 });
      //   console.log(err);
    });
    res
      .status(200)
      .json({ message: "Order patched successfully", status: 200 });
  } catch (err) {
    res.status(500);
  }
});

module.exports = {
  ordersRoute: router,
  getOrders,
};
