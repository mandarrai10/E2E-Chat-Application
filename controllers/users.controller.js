const User = require("../model/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res, next) => {
  try {
    // Get user input
    const { usernameSignup, passwordSignup } = req.body;

    // Validate user input
    if (!(passwordSignup && usernameSignup)) {
      res.status(400).send("All input is required");
      return;
    }

    // if (passwordSignup.length < 6) {
    //     return res.status(400).json({ message: "Password less than 6 characters" });
    // }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ usernamelowercase: usernameSignup.toLowerCase() });

    if (oldUser) {
      return res.status(409).send({ status: 409, message: "Username Already Exist. Please Login." });
    }

    //Encrypt user password
    encryptedUserPassword = await bcrypt.hash(passwordSignup, 10);

    // Create user in our database
    const user = await User.create({
      usernamelowercase: usernameSignup.toLowerCase(),
      username: usernameSignup,
      password: encryptedUserPassword,
    });

    // Create token
    const token = jwt.sign({ user_id: user._id, usernameSignup },
      process.env.TOKEN_KEY, {
      expiresIn: "5h",
    }
    );
    // save user token
    user.token = token;
    await User.updateOne({ usernamelowercase: usernameSignup.toLowerCase() }, { $set: { token: token } });

    res.cookie("jwt", token, {
      httpOnly: true,
      expiresIn: "5h", // 3hrs in ms
    });

    return res.send({ status: 201, redirect: "/" });
  } catch (err) {
    console.log(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Get user input
    const { usernameLogin, passwordLogin } = req.body;

    // Validate user input
    if (!(usernameLogin && passwordLogin)) {
      res.status(400).send("All input is required");
    }

    // Validate if user exist in our database
    const user = await User.findOne({ usernamelowercase: usernameLogin.toLowerCase() });

    if (user && (await bcrypt.compare(passwordLogin, user.password))) {
      // Create token
      const token = jwt.sign({ user_id: user._id, usernameLogin },
        process.env.TOKEN_KEY, {
        expiresIn: "5h",
      }
      );

      // save user token
      user.token = token;
      await User.updateOne({ usernamelowercase: usernameLogin.toLowerCase() }, { $set: { token: token, status: 1 } });

      res.cookie("jwt", token, {
        httpOnly: true,
        expiresIn: "5h", // 3hrs in ms
      });

      // res.set('x-access-token', token);
      return res.send({ status: 200, redirect: "/" });
    }
    return res.status(400).json({ status: 400, message: "Invalid credentials" });
  } catch (err) {
    console.log(err);
  }
};

exports.logout = async (req, res, next) => {
  if (!req.cookies.jwt)
    return res.status(403).json({ message: "Not successful", error: "You must be logged in to perform this action" });
  try {
    await User.updateOne({ token: req.cookies.jwt }, { $set: { token: -1, status: 0 } });
    res.cookie("jwt", "", { maxAge: "1" }) // Supprime le token de l'utilisateur
    return res.status(200).send({ status: 200, redirect: "/" });
  } catch (err) {
    res.status(401).json({ message: "Not successful", error: err.message, redirect: "/" })
  }
}


exports.getUsers = async (req, res, next) => {
  await User.find({})
    .then((users) => {
      const userFunction = users.map((user) => {
        const container = {};
        container.id = user._id;
        container.username = user.username;
        return container;
      });
      res.status(200).json({ user: userFunction });
    })
    .catch((err) =>
      res.status(401).json({ message: "Not successful", error: err.message })
    );
};

exports.getOnlineUsers = async (req, res, next) => {
  if (!req.cookies.jwt)
    return res.status(403).json({ message: "Not successful", error: "You must be logged in to perform this action" });
  try {
    await User.find({ status: true })
      .then((users) => {
        const onlineUsers = users.map((user) => {
          return user.username;
          // const container = {};
          // container.id = user._id;
          // container.username = user.username;
          // return container;
        });
        return res.status(200).send({ status: 200, users: onlineUsers });
      })
  } catch (err) {
    res.status(401).json({ message: "Not successful", error: err.message })
  }
}

exports.getUsername = async (req, res, next) => {
  if (!req.cookies.jwt)
    return res.status(403).json({ message: "Not successful", error: "You must be logged in to view your nickname." });
  try {

    const user = await User.findOne({ token: req.cookies.jwt });
    if (!user)
      return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });
    return res.status(200).json({ username: user.username, id: user._id });
  } catch (err) {
    res.status(401).json({ message: "Not successful", error: err.message })
  }
};
