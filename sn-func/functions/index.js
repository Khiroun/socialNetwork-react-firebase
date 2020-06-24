const functions = require("firebase-functions");
const express = require("express");

const {
  getAllScreams,
  postOneScream,
  getScreamById,
  postOneComment,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/users");
const fbAuth = require("./utils/fbAuth");

const app = express();

//Screams Routes

app.get("/screams", getAllScreams);
app.post("/scream", fbAuth, postOneScream);
app.get("/scream/:id", getScreamById);
app.post("/scream/:screamId/comment", fbAuth, postOneComment);
app.delete("/scream/:screamId", fbAuth, deleteScream);
app.get("/scream/:screamId/like", fbAuth, likeScream);
app.get("/scream/:screamId/unlike", fbAuth, unlikeScream);

//Users Routes

app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", fbAuth, uploadImage);
app.get("/user", fbAuth, getAuthenticatedUser);
app.patch("/user", fbAuth, addUserDetails);

exports.api = functions.region("europe-west1").https.onRequest(app);
