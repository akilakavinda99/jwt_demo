const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const e = require("express");
const app = express();

app.use(express.json());
app.use(cors());

const PORT = 5000 || process.env.PORT;

// users array

const users = [
  {
    id: "1",
    name: "John",
    password: "John123",
    isAdmin: true,
  },
  {
    id: "2",
    name: "Jane",
    password: "Jane123",
    isAdmin: false,
  },
  {
    id: "3",
    name: "Jenny",
    password: "Jenny123",
    isAdmin: false,
  },
];

var refreshTokens = [];

const refreshTokenCreate = (user) => {
  return jwt.sign({ id: user.id, admin: user.isAdmin }, "TempRefreshSecretKey");
};
app.post("/refreshToken", (req, res) => {
  const refreshToken = req.body.token;

  if (!refreshToken) return res.status(401).send("Not authenticated");
  if (!refreshTokens.includes(refreshToken)) {
    return res.status(403).send("refresh token not valid");
  }
  jwt.verify(refreshToken, "TempRefreshSecretKey", (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
    const newAccessToken = jwt.sign(
      { id: user.id, admin: user.isAdmin },
      "TempSecretKey",
      {
        expiresIn: "60s",
      }
    );
    const newRefreshTOken = refreshTokenCreate(user);
    refreshTokens.push(newRefreshTOken);
    res.status(200).send({
      newAccessToken,
      newRefreshTOken,
    });
  });
});

app.post("/login", (req, res) => {
  const { user, password } = req.body;
  const userExists = users.find((u) => {
    return u.name == user && u.password == password;
  });
  if (userExists) {
    const accessToken = jwt.sign(
      { id: userExists.id, admin: userExists.isAdmin },
      "TempSecretKey",
      {
        expiresIn: "20s",
      }
    );
    const refreshTOken = refreshTokenCreate(user);
    refreshTokens.push(refreshTOken);
    res.json({
      uid: userExists.name,
      accessToken,
      refreshTOken,
    });
  } else {
    res.status(400).json("username or password incorrect");
  }
});

const verify = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, "TempSecretKey", (err, user) => {
      if (err) {
        return res.status(403).send("Token invalid");
      }
      req.user = user;
      next();
    });
  } else {
    res.status(401).send("You are not authenticated");
  }
};

app.delete("/delete/:userId", verify, (req, res) => {
  if (req.user.id == req.params.userId || req.user.isAdmin) {
    res.status(200).send("user deleted");
  } else {
    res.status(500).send("user cant be deleted");
  }
});
app.listen(PORT, () => console.log("Server started"));
