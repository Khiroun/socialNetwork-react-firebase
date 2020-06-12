const { db } = require("../utils/admin");

exports.getAllScreams = (req, res) => {
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
};

exports.postOneScream = (req, res) => {
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
};

exports.getScreamById = (req, res) => {
  const { id } = req.params;
  let screamData = {};
  db.doc(`screams/${id}`)
    .get()
    .then((doc) => {
      if (doc.exists) {
        screamData = { id, ...doc.data() };
        return db
          .collection("comments")
          .where("screamId", "==", id)
          .orderBy("createdAt", "desc")
          .get();
      }
      return res.status(404).json({ error: "scream not found" });
    })
    .then((docs) => {
      screamData.comments = [];
      docs.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch((e) => {
      console.error(e);
      return res.status(500).json({ error: e.code });
    });
};

exports.postOneComment = (req, res) => {
  const { screamId } = req.params;
  const { body } = req.body;
  const { handle, userImage } = req.user;
  if (!body || body.trim() === "")
    return res.status(400).json({ error: "comment cannot be empty" });

  db.doc(`screams/${screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists)
        return res.status(404).json({ error: "Scream not found" });
      const newComment = {
        screamId,
        body,
        userHandle: handle,
        createdAt: new Date().toISOString(),
        userImage,
      };
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return res.json({ message: "Comment posted successfully" });
    })
    .catch((e) => {
      console.error(e);
      return res.status(500).json({ error: e.code });
    });
};
