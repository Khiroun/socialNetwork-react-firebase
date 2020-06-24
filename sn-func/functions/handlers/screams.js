const { db } = require("../utils/admin");

exports.getAllScreams = (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      const screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          ...doc.data()
        });
      });
      return res.json(screams);
    })
    .catch(err => console.error(err));
};

exports.postOneScream = (req, res) => {
  const { handle, userImage } = req.user;
  const newScream = {
    body: req.body.body,
    userHandle: handle,
    userImage,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      const resScream = { id: doc.id, ...newScream };
      res.json(resScream);
    })
    .catch(err => {
      res.status(500).json({ message: "something went wrong", err: err });
    });
};

exports.getScreamById = (req, res) => {
  const { id } = req.params;
  let screamData = {};
  db.doc(`screams/${id}`)
    .get()
    .then(doc => {
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
    .then(docs => {
      screamData.comments = [];
      docs.forEach(doc => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch(e => {
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
    .then(doc => {
      if (!doc.exists)
        return res.status(404).json({ error: "Scream not found" });

      const commentCount = doc.data().commentCount | 0;
      return doc.ref.update({ commentCount: commentCount + 1 });
      //
    })
    .then(() => {
      const newComment = {
        screamId,
        body,
        userHandle: handle,
        createdAt: new Date().toISOString(),
        userImage
      };
      return db.collection("comments").add(newComment);
    })
    .then(() => {
      return res.json({ message: "Comment posted successfully" });
    })
    .catch(e => {
      console.error(e);
      return res.status(500).json({ error: e.code });
    });
};

exports.likeScream = (req, res) => {
  const { screamId } = req.params;
  const { handle } = req.user;

  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", handle)
    .where("screamId", "==", screamId)
    .limit(1);

  const screamDocument = db.doc(`/screams/${screamId}`);

  let screamData;
  screamDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        screamData = { id: doc.id, ...doc.data() };
        return likeDocument.get();
      }
      return res.status(404).json({ error: "Scream not found" });
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection("likes")
          .add({ screamId, userHandle: handle })
          .then(() => {
            screamData.likeCount
              ? screamData.likeCount++
              : (screamData.likeCount = 1);
            return screamDocument
              .update({ likeCount: screamData.likeCount })
              .then(() => {
                return res.json(screamData);
              });
          });
      } else {
        return res.status(400).json({ error: "Scream Already liked" });
      }
    })
    .catch(e => {
      console.error(e);
      return res.status(500).json({ error: e.code });
    });
};

exports.unlikeScream = (req, res) => {
  const { screamId } = req.params;
  const { handle } = req.user;
  const likeDocument = db
    .collection("likes")
    .where("userHandle", "==", handle)
    .where("screamId", "==", screamId)
    .limit(1);
  const screamDocument = db.doc(`/screams/${screamId}`);

  let screamData;

  screamDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        screamData = { id: doc.id, ...doc.data() };
        likeDocument.get().then(data => {
          if (data.empty) {
            return res.status(400).json({ error: "Scream Already not liked" });
          } else {
            return db
              .doc(`/likes/${data.docs[0].id}`)
              .delete()
              .then(() => {
                screamData.likeCount
                  ? screamData.likeCount--
                  : (screamData.likeCount = 0);
                return screamDocument
                  .update({ likeCount: screamData.likeCount })
                  .then(() => {
                    return res.json(screamData);
                  });
              });
          }
        });
      } else {
        return res.status(404).json({ error: "Scream Not Found" });
      }
    })
    .catch(e => {
      console.error(e);
      return res.status(500).json({ error: e.code });
    });
};

exports.deleteScream = (req, res) => {
  const { screamId } = req.params;
  const { handle } = req.user;
  const document = db.doc(`/screams/${screamId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream Not Found" });
      }
      if (!handle === doc.data().userHandle) {
        return res.status(403).json({ error: "Unauthrised" });
      }
      return document
        .delete()
        .then(() => res.json({ message: "Document Deleted successfully" }));
    })
    .catch(e => {
      console.error(e);
      return res.status(500).json({ error: e.code });
    });
};
