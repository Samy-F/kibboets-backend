const router = require("express").Router();

let axios = require("axios");
var convert = require("xml-js");
var _ = require("lodash");

//complete outside function for creating the routes
const getKoerierData = async (origin, destination) => {
  console.warn("request made");
  //restaurant is needed for the maps api route
  const restaurant = "52.293069,4.861301";

  //get all the delivery guys from the orderbuddy api
  const getKoeriers = async (type) => {
    let config = {
      method: "get",
      url: "https://api.foodticket.nl/1/deliverers",
      headers: {
        "X-OrderBuddy-Client-Id": "5704",
        "X-OrderBuddy-API-Key": "91ee337266ee0790e95a20bd5793c4dd",
      },
    };

    const res = await axios(config);
    let xml = res.data;
    let data = convert.xml2json(xml, { compact: true, spaces: 4 });
    var json = JSON.parse(data);
    const koeriersObj = json["data"]["row"];

    // filter and get the active delivery guys
    const activeKoeriers = koeriersObj.filter((koerier) => {
      return koerier["coord"]["_text"] !== undefined;
    });

    // filter and get the inactive delivery guys
    const inActiveKoeriers = koeriersObj.filter((koerier) => {
      return koerier["coord"]["_text"] === undefined;
    });

    // console.log(activeKoeriers);
    // console.warn(inActiveKoeriers);
    // console.log(koeriersObj);
    return activeKoeriers;
  };

  //Get route time
  const getRouteTime = async (origin, destination, mode) => {
    let apiKey = "PTGK21b4ty6ZyJvkDDj5DotH5lLd3gXm";

    if (mode == "bicycle") {
      var config = {
        method: "get",
        url: `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?computeBestOrder=true&routeType=fastest&traffic=true&travelMode=${mode}&vehicleMaxSpeed=20&key=UfA7AewZMRrHFJIyEHefa3zTR3f9MB8F`,
        headers: {},
      };
    } else if (mode == "car") {
      var config = {
        method: "get",
        url: `https://api.tomtom.com/routing/1/calculateRoute/${origin}:${destination}/json?computeBestOrder=true&routeType=fastest&traffic=true&travelMode=${mode}&key=UfA7AewZMRrHFJIyEHefa3zTR3f9MB8F`,
        headers: {},
      };
    }

    const res = await axios(config);
    // console.log(res.data);
    const duration = res.data.routes[0].summary.travelTimeInSeconds;
    // console.log(duration);
    return duration;
  };

  //gets all the orders from the foodticket api
  const getOrders = async (startDate, endDate) => {
    var config = {
      method: "get",
      url: "https://api.foodticket.net/1/orders?sdate_start=2022-03-29&sdate_end=2022-03-29",
      headers: {
        "X-OrderBuddy-Client-Id": "5704",
        "X-OrderBuddy-API-Key": "91ee337266ee0790e95a20bd5793c4dd",
      },
    };

    const res = await axios(config).catch((err) => console.log(err));
    let data = convert.xml2json(res.data, { compact: true, spaces: 4 });
    let ordersData = JSON.parse(data);
    let orders;

    if (Object.keys(ordersData["orders"]).length !== 0) {
      if (ordersData["orders"]["order"]["id"] === undefined) {
        orders = ordersData["orders"]["order"];
        // console.log(orders);
      } else {
        orders = [ordersData["orders"]["order"]];
        // console.log(orders);
      }
    } else {
      orders = null;
    }

    // console.log(orders);
    return orders;

    // console.log(
    //   "------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------"
    // );
  };

  //driver specifik orders, gets called with two options
  const getKoerierOrders = async (id, status) => {
    let orders = await getOrders();

    // console.log(orders);
    if (orders != null) {
      //  && order.status === "enroute"
      orders = orders.filter((order) => {
        console.log(order.status);
        return (
          order.status._text === "enroute" && order.deliverer_id._text === id
        );
      });

      streetNames = orders.map((order) => {
        return [order.address._text, order.id._text];
      });

      return streetNames;
    } else {
      return [];
    }
  };

  //create total object of everything needed
  const createOrderKoerierObj = (obj) => {
    const koeriers = obj.map(async (koerier) => {
      if (koerier.google_directions_mode._text === "driving") {
        koerier.google_directions_mode._text = "car";
      } else {
        koerier.google_directions_mode._text = "bicycle";
      }

      // const routeTime = 500;
      // koerier.coord._text = "52.28066949448484,4.8680310685466885";

      const routeTime = await getRouteTime(
        koerier.coord._text,
        restaurant,
        koerier.google_directions_mode._text
      );

      return {
        id: koerier.id._text,
        name: koerier.firstname._text,
        mode: koerier.google_directions_mode._text || "undefined",
        coord: koerier.coord._text,
        lat: koerier.coord._text.split(",")[0],
        long: koerier.coord._text.split(",")[1],
        orders: JSON.stringify(await getKoerierOrders(koerier.id._text)),
        routeTime: routeTime,
      };
    });

    let totalKoerier = Promise.all(koeriers);

    return totalKoerier;
  };

  const koeriersObj = await getKoeriers();
  const koeriers = await createOrderKoerierObj(koeriersObj);
  return koeriers;
};

router.get("/", async (req, res) => {
  try {
    let koerierData = await getKoerierData();
    console.log(koerierData);
    res.status(200).json(koerierData);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

//get all

module.exports = router;
