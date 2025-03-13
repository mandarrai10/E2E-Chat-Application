require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const cookieParser = require("cookie-parser");
var cookie = require("cookie");

const app = express();

app.use(cookieParser());
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodiesI

const path = require("path");
const htmlPath = path.join(__dirname, "/source");
app.use(express.static(htmlPath));

app.use("/styles", express.static(__dirname + "/source/stylesheets"));
app.use("/scripts", express.static(__dirname + "/source/javascripts"));
app.use("/images", express.static(__dirname + "/source/images"));

// Routing //

const verifyToken = require("./middleware/verifyToken");

// Redirects to the home page if the token (cookie) is valid; otherwise, it returns the login page.
app.get("/", verifyToken, (req, res) => {
  if (req.user) {
    res.status(200).sendFile(__dirname + "/source/home.html");
  } else {
    const status = req.err && req.err.status ? req.err.status : 401;
    res.status(status).sendFile(__dirname + "/source/login.html");
  }
});

require("./routes/users.routes")(app);
require("./routes/conversations.routes")(app);

// Initialize serveur HTTP/HTTPS //

let SSL = process.env.SSL;
const PORT = process.env.API_PORT;
SSL = SSL == "true" ? true : false;

var cfg = {
  ssl: SSL,
  port: PORT,
  ssl_key: "./privkey.pem",
  ssl_cert: "./fullchain.pem",
};

var httpServ = cfg.ssl ? require("https") : require("http");
var server = null;

// var processRequest = function (req, res) {
//     console.log("Request received.")
// };

const fs = require("fs");
if (cfg.ssl) {
  server = httpServ.createServer(
    {
      // providing server with  SSL key/cert
      key: fs.readFileSync(cfg.ssl_key),
      cert: fs.readFileSync(cfg.ssl_cert),
    },
    app
  );
} else {
  server = httpServ.createServer(app);
}

// WEBSOCKETS //

const socketIO = require("socket.io");
const io = socketIO(server);

const clientList = new Map();
// const diffieHellmanProtocol = new Array();
console.log("\nServer is open !\n");

const MessageModel = require("./model/message");
const User = require("./model/user");
const Conversation = require("./model/conversation");

// CryptoJS //

const CryptoJS = require("crypto-js");

io.on("connection", async (socket) => {
  // Checks if the Discussions channel exists and creates it if it doesn't
  const discussions = await Conversation.findOne({ userId1: null });
  if (!discussions) {
    console.log("Création du canal Discussions");
    await Conversation.create({
      userId1: null,
      userId2: null,
      lastMessageId: null,
      encrypted: false,
    });
  }

  var cookies = cookie.parse(socket.handshake.headers.cookie);
  const user = await User.findOne({ token: cookies.jwt });
  const metadata = { username: user.username, id: user._id };
  console.log("%s is now connected!", metadata.username);
  clientList.set(socket, metadata);
  await User.updateOne({ token: cookies.jwt }, { $set: { status: 1 } });
  socket.emit("connected", metadata);

  sendAllStoredMessages(socket);

  socket.on("newMessage", async (message) => {
    let newMessage = new MessageModel(message);
    newMessage.save();

    let messageId = newMessage._id;
    console.log(message);

    const conv = await Conversation.findOne({ _id: message.idchat });
    if (!conv) {
      console.log("ERR - Conversation non trouvée");
      return;
    }

    await Conversation.findOneAndUpdate(
      { _id: message.idchat },
      { lastMessageId: messageId }
    );

    if (!conv.userId1) {
      clientList.forEach(function (metadata, clientSocket) {
        console.log("Sent to " + metadata.username);
        clientSocket.emit("newMessage", message);
      });
    } else {
      clientList.forEach(function (metadata, clientSocket) {
        if (
          metadata.id.equals(conv.userId1) ||
          metadata.id.equals(conv.userId2)
        ) {
          console.log("Sent to " + metadata.username);
          clientSocket.emit("newMessage", message);
        }
      });
    }
  });

  socket.on("newConversation", async (data) => {
    socket.emit("newConversation");
    clientList.forEach(function (metadata, clientSocket) {
      if (metadata.id.equals(data.userId2)) {
        clientSocket.emit("newConversation");
      }
    });
  });

  socket.on("engageDiffieHellman", async (data) => {
    clientList.forEach(function (metadata, clientSocket) {
      if (metadata.id.equals(data.userId2)) {
        clientSocket.emit("notifDiffieHellman", data);
        console.log("DH notif sent to " + metadata.username);
      }
    });
  });

  socket.on("acceptedDiffieHellman", async (data) => {
    clientList.forEach(function (metadata, clientSocket) {
      if (metadata.id.equals(data.userId1)) {
        clientSocket.emit("acceptedDiffieHellman", data);
      }
    });
  });

  socket.on("cancelDiffieHellman", async (userId1, userId2) => {});

  socket.on("disconnect", async () => {
    console.log("%s has disconnected", clientList.get(socket).username);
    await User.updateOne(
      { _id: clientList.get(socket).id },
      { $set: { status: 0 } }
    );
    clientList.delete(socket);
  });
});

// Send to the client all the stored messages
async function sendAllStoredMessages(socket) {
  let metadata = clientList.get(socket);
  var convIds = new Array();
  await Conversation.find({
    $or: [
      { userId1: null },
      { userId1: metadata.id },
      { userId2: metadata.id },
    ],
  }).then(async function (convs) {
    convs.forEach(function (conv) {
      convIds.push(conv._id);
    });

    await MessageModel.find({ idchat: { $in: convIds } }).then(function (msgs) {
      msgs.sort(function (a, b) {
        return a.time - b.time;
      });

      socket.emit("allMessages", msgs);
    });
  });
}

module.exports = server;