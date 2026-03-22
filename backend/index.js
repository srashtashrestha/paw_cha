const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.get(
    "/",
    (req, res) => {
        res.send("Hello")
    }
)

app.listen(
    5000,
    () =>   console.log("Backend is running")
)
 mongoose.connect("mongodb+srv://srashtashr06:FBviKZs8IZgDGtsP@petadoptionportal.59hlh2j.mongodb.net/")

 .then(
    () => {
        console.log("DB Connected");
    }
).catch(
        () => {
            console.log("Failed");
        }

)