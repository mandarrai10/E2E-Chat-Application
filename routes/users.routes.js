module.exports = (app) => {
  const {
    register,
    login,
    logout,
    getUsers,
    getOnlineUsers,
    getUsername,
  } = require("../controllers/users.controller");
  var router = require("express").Router();

  // Executes the register routine
  router.post("/register", register);

  // Executes the login routine
  router.post("/login", login);

  // Displays all users from the database
  router.get("/getUsers", getUsers);

  // Retrieves the connected users
  router.get("/getOnlineUsers", getOnlineUsers);

  // Retrieves the username of the connected user
  router.get("/getUsername", getUsername);

  // Disconnects a user (sets them offline and destroys their cookie)
  router.get("/logout", logout);

  app.use("/api/users", router);
};
