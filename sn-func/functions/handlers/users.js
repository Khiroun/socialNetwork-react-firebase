const firebase = require("firebase");

const { db, admin } = require("../utils/admin");
const config = require("../utils/config");
const {
  validateSignupData,
  validateLoginData,
} = require("../utils/validators");

firebase.initializeApp(config);

exports.signup = (req, res) => {
  const { email, password, confirmPassword, handle } = req.body;

  /***********************************************************/
  const newUser = { email, password, confirmPassword, handle };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  let token, userId;
  const noImg = "no-image.png";

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
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
};

exports.login = (req, res) => {
  const { email, password } = req.body;
  const user = { email, password };

  const { valid, errors } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

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
};

exports.uploadImage = (req, res) => {
  const Busboy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  let imageFileName;
  let imageToBeUploaded = {};

  const busboy = new Busboy({ headers: req.headers });
  busboy.on("file", (fieldName, file, filename, encoding, mimetype) => {
    if (mimetype !== "image/jpeg" && mimetype != "image/jpeg")
      return res.status(400).json({ error: "wrong fileType" });
    console.log(filename);
    console.log(fieldName);
    console.log(mimetype);

    const x = filename.split(".");
    const imageExtention = x[x.length - 1];
    imageFileName = `${Math.round(
      Math.random() * 9999999999
    )}.${imageExtention}`;

    const filePath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(config.storageBucket)
      .upload(imageToBeUploaded.filePath, {
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        res.json({ message: "Image uploaded succesfully" });
      })
      .catch((e) => {
        res.status(500).json({ error: e.code });
      });
  });

  busboy.end(req.rawBody);
};
