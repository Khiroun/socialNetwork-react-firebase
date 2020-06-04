const functions = require("firebase-functions");
const admin = require("firebase-admin");
const firebase = require("firebase");
const express = require("express");

const app = express();

admin.initializeApp({
  credential: admin.credential.cert(require("./key/admin.json")),
});

const config = {
  apiKey: "AIzaSyBRHAHFlOQ87HcPzgdEWsCH-TMDs1kNROA",
  authDomain: "socialnet-54163.firebaseapp.com",
  databaseURL: "https://socialnet-54163.firebaseio.com",
  projectId: "socialnet-54163",
  storageBucket: "socialnet-54163.appspot.com",
  messagingSenderId: "1048982530309",
  appId: "1:1048982530309:web:c306815e813b78926eef6c",
  measurementId: "G-ZSV3421SCE",
};

firebase.initializeApp(config);

const db = admin.firestore();

app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then((data) => {
      const screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          ...doc.data(),
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err));
});

app.post("/scream", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString(),
  };

  db.collection("screams")
    .add(newScream)
    .then((doc) => {
      res.json({ message: `doc ${doc.id} was created successfully` });
    })
    .catch((err) => {
      res.status(500).json({ message: "something went wrong", err: err });
    });
});

//Sign up route
app.post("/signup", (req, res) => {
  const { email, password, confirmPassword, handle } = req.body;
  // TODO: validate data
  const newUser = { email, password, confirmPassword, handle };
  let token, userId;
  db.doc(`users/${handle}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        return res.status(400).json({
          handle: "this handle is already taken",
        });
      } else {
        return firebase.auth().createUserWithEmailAndPassword(email, password);
      }
    })
    .then((data) => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then((idtoken) => {
      token = idtoken;
      const userCredentials = {
        handle,
        email,
        createdAt: new Date().toISOString(),
        userId,
      };

      return db.doc(`/users/${handle}`).set(userCredentials);
    })
    .then((data) => {
      return res.status(201).json({ token });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({
          email: "this email is already in use",
        });
      } else {
        return res.status(500).json({ error: err });
      }
    });
});

exports.api = functions.region("europe-west1").https.onRequest(app);
