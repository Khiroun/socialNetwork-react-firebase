const functions = require("firebase-functions");
const express = require("express");

const { getAllScreams, postOneScream } = require("./handlers/screams");
const { signup, login } = require("./handlers/users");
const fbAuth = require("./utils/fbAuth");

const app = express();

//Screams Routes

app.get("/screams", getAllScreams);
app.post("/scream", fbAuth, postOneScream);

//Users Routes

app.post("/signup", signup);
app.post("/login", login);

exports.api = functions.region("europe-west1").https.onRequest(app);
