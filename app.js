require("dotenv").config();
require("./config/database").connect();
const express = require("express");
const cookieParser = require("cookie-parser");
var cookie = require("cookie");

const app = express();

app.use(cookieParser());
app.use(express.json()); // to support JSON-encoded bodies
app.use(express.urlencoded({ extended: true })); // to support URL-encoded bodies

const path = require("path");
const htmlPath = path.join(__dirname, "/source");
app.use(express.static(htmlPath));

app.use("/styles", express.static(__dirname + "/source/stylesheets"));
app.use("/scripts", express.static(__dirname + "/source/javascripts"));
app.use("/images", express.static(__dirname + "/source/images"));

// Routing //

const verifyToken = require("./middleware/verifyToken");

// Access the home page if the token (cookie) is valid, otherwise return the login page
app.get("/", verifyToken, (req, res) => {
  if (req.user) res.status(200).sendFile(__dirname + "/source/home.html");
  else res.status(req.err.status).sendFile(__dirname + "/source/login.html");
});

require("./routes/users.routes")(app);
require("./routes/conversations.routes")(app);

// Initialize HTTP/HTTPS server //

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
      // providing server with SSL key/cert
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
  // Check if the Discussions channel exists and create it if not
  const discussions = await Conversation.findOne({ userId1: null });
  if (!discussions) {
    console.log("Creating the Discussions channel");
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

  // ToDo: do not send all messages (let the user fetch messages by clicking on a conversation)
  sendAllStoredMessages(socket);

  socket.on("newMessage", async (message) => {
    let newMessage = new MessageModel(message);
    newMessage.save();

    let messageId = newMessage._id;
    console.log(message);

    // Get the conversation of the message
    const conv = await Conversation.findOne({ _id: message.idchat });
    if (!conv) {
      console.log("ERR - Conversation not found");
      return;
    }

    // Update the conversation by storing the new message ID
    await Conversation.findOneAndUpdate(
      { _id: message.idchat },
      { lastMessageId: messageId }
    );

    // If general chat: send the message to all connected clients
    if (!conv.userId1) {
      clientList.forEach(function (metadata, clientSocket) {
        console.log("Sent to " + metadata.username);
        clientSocket.emit("newMessage", message);
      });
    }
    // Otherwise: send it only to the two concerned users
    else {
      // ToDo: better retrieve users via the Map
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
    // Transmit the new conversation to the two concerned users
    socket.emit("newConversation");
    clientList.forEach(function (metadata, clientSocket) {
      if (metadata.id.equals(data.userId2)) {
        clientSocket.emit("newConversation");
      }
    });
  });

  // User 1 wants to initiate a DH with user 2
  socket.on("engageDiffieHellman", async (data) => {
    // diffieHellmanProtocol.push({userId1: data.userId1, userId2: data.userId2});
    // Send notification to user2
    clientList.forEach(function (metadata, clientSocket) {
      if (metadata.id.equals(data.userId2)) {
        clientSocket.emit("notifDiffieHellman", data);
        console.log("DH notif sent to " + metadata.username);
      }
    });
  });

  // User 2 has accepted the DH, sending their B value back to user A
  socket.on("acceptedDiffieHellman", async (data) => {
    // Send acceptance to user1
    clientList.forEach(function (metadata, clientSocket) {
      if (metadata.id.equals(data.userId1)) {
        clientSocket.emit("acceptedDiffieHellman", data);
      }
    });
  });

  socket.on("cancelDiffieHellman", async (userId1, userId2) => {
    // ToDo: cancelDiffieHellman removes the pair from the diffieHellmanProtocol array
  });

  // On socket disconnection: set user offline
  socket.on("disconnect", async () => {
    console.log("%s has disconnected", clientList.get(socket).username);
    await User.updateOne(
      { _id: clientList.get(socket).id },
      { $set: { status: 0 } }
    );
    clientList.delete(socket);
  });
});

// Send all stored messages to the client
async function sendAllStoredMessages(socket) {
  let metadata = clientList.get(socket);
  // Get all chats of a user
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

    // Get only messages from the user's chats
    await MessageModel.find({ idchat: { $in: convIds } }).then(function (msgs) {
      // Sort messages by timestamp
      msgs.sort(function (a, b) {
        return a.time - b.time;
      });

      socket.emit("allMessages", msgs);
    });
  });
}

module.exports = server;
