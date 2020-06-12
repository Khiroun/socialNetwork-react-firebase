const { admin, db } = require("./admin");

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
      return db
        .collection("users")
        .where("userId", "==", decodedToken.uid)
        .limit(1)
        .get();
    })
    .then((data) => {
      req.user.handle = data.docs[0].data().handle;
      req.user.userImage = data.docs[0].data().imageUrl;
      return next();
    })
    .catch((err) => {
      console.error(err);
      return res.status(403).json(err);
    });
};

module.exports = fbAuth;
