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

const fbAuth = (req, res, next) => {
  const { authorization } = req.headers;
  const bearer = "Bearer ";
  let idToken;
  if (authorization && authorization.startsWith(bearer)) {
    idToken = authorization.split(bearer)[1];
  } else {
    return res.status(403).json({ error: "Unauthorized" });
  }

  admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      req.user = decodedToken;
      console.log(decodedToken);
      return db
        .collection("users")
        .where("userId", "==", decodedToken.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.handle = data.docs[0].data().handle;
      return next();
    })
    .catch((err) => {
      console.error(err);
      return res.status(403).json(err);
    });
};

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

app.post("/scream", fbAuth, (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
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

const isEmpty = (string) => {
  if (string.trim() === "") return true;
  return false;
};

const isEmail = (email) => {
  const emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(emailRegEx)) return true;
  return false;
};
//Sign up route
app.post("/signup", (req, res) => {
  const { email, password, confirmPassword, handle } = req.body;
  // TODO: validate data
  const errors = {};
  if (isEmpty(email)) {
    errors.email = "email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "must be a valid email adress";
  }

  if (isEmpty(password)) errors.password = "password must not be empty";
  if (password !== confirmPassword)
    errors.confirmPassword = "passwords must be the same";

  if (isEmpty(handle)) errors.handle = "handle must not be empty";

  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  /***********************************************************/
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

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = { email, password };
  const errors = {};
  if (isEmpty(email)) errors.email = "Must not be empty";
  else if (!isEmail(email)) errors.email = "Must be valid email";
  if (isEmpty(password)) errors.password = "Must not be empty";
  if (Object.keys(errors).length > 0) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((data) => {
      return data.user.getIdToken();
    })
    .then((token) => {
      return res.json({ token });
    })
    .catch((err) => {
      if (err.code === "auth/wrong-password")
        return res.status(403).json({ general: "wrong password" });
      res.status(500).json({ err: err.code });
    });
});

exports.api = functions.region("europe-west1").https.onRequest(app);
