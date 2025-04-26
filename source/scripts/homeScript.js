const socket = io();

class Message {
  constructor(idchat, author, content, time) {
    this.idchat = idchat;
    this.author = author;
    this.content = content;
    this.time = time;
  }
}

async function getUsername() {
  try {
    const res = await fetch("/api/users/getUsername", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.status === 400 || res.status === 401) {
      return (display.textContent = `${data.message}. ${
        data.error ? data.error : ""
      }`);
    }
    return data;
  } catch (err) {
    console.log(err.message);
  }
}

async function getConversations() {
  try {
    const res = await fetch("/api/chats/getConversations", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.status === 400 || res.status === 401) {
      console.log(`${data.message}. ${data.error ? data.error : ""}`);
    }
    return data;
  } catch (err) {
    console.log(err.message);
  }
}

async function getOnlineUsers() {
  try {
    const res = await fetch("/api/users/getOnlineUsers", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (data.status === 200) return data.users;
    else console.log(data);
  } catch (err) {
    console.log(err.message);
  }
}

// Square and Multiply from: https://gist.github.com/krzkaczor/0bdba0ee9555659ae5fe
function expmod(a, b, n) {
  a = a % n;
  var result = 1;
  var x = a;

  while (b > 0) {
    var leastSignificantBit = b % 2;
    b = Math.floor(b / 2);

    if (leastSignificantBit == 1) {
      result = result * x;
      result = result % n;
    }

    x = x * x;
    x = x % n;
  }
  return result;
}

let myPseudo = "Random";
let myId = "";
let activeConversationId;
let messagesDict = {};
let conversations = Array();
let AESKeys = new Map();

// What to do when the connection is established
socket.on("connected", (metadata) => {
  console.log("We are connected,", metadata.username);
});

// What to do when the client receives a message from the server
socket.on("newMessage", (message) => {
  // If the message is in an unlocked encrypted chat: decrypt it
  if (AESKeys.has(message.idchat)) {
    message.content = CryptoJS.AES.decrypt(
      message.content,
      AESKeys.get(message.idchat)
    );
    message.content = message.content.toString(CryptoJS.enc.Utf8);
  }

  // Store messages in the messagesDict dictionary by chats:
  //      "chatid": [message, message, message]
  if (!(message.idchat in messagesDict)) messagesDict[message.idchat] = Array();
  messagesDict[message.idchat].push(message);

  // Display messages if the new message is in the active conversation
  if (message.idchat == activeConversationId) renderMessages();

  // Update lastMessage and messageHour and bring the conversation to the top
  renderConversations();
});

socket.on("allMessages", (msgs) => {
  msgs.forEach((message) => {
    if (!(message.idchat in messagesDict))
      messagesDict[message.idchat] = Array();
    messagesDict[message.idchat].push(message);
  });

  // Display messages and update conversations
  renderMessages();
  renderConversations();
});

function convertTimestampToTime(timestamp) {
  let msgdate = new Date(parseInt(timestamp));
  // Remove the trailing colon by not adding it in the first place
  return msgdate.toLocaleTimeString().slice(0, 5);
}

function convertTimestampToDate(timestamp) {
  let msgdate = new Date(parseInt(timestamp));
  return msgdate.toLocaleDateString();
}

async function renderConversations() {
  await getConversations().then(async function (res) {
    conversations = res.chats;

    if (!conversations) return;

    // Filter encrypted conversations where the key has been entered
    let stillEncrypted = 0; // Number of unencrypted conversations
    for (let i = conversations.length - 1; i >= 0; --i) {
      if (conversations[i].encrypted) {
        if (AESKeys.has(conversations[i]._id)) {
          conversations[i].unlocked = true;
        } else {
          conversations[i].unlocked = false;
          stillEncrypted++;
        }
      }
    }

    // Get online users
    await getOnlineUsers().then(function (onlineUsers) {
      $("#contact-list").empty();
      for (let i = 0; i < conversations.length; i++) {
        // Do not display unencrypted conversations
        if (conversations[i].encrypted && !conversations[i].unlocked) continue;

        $("#contact-list").append(`
                    <div id="contact-${i}" class="row sideBar-body">
                      <div class="sideBar-main">
                          <div class="row">
                              <div class="col-sm-8 col-xs-8 sideBar-name">
                                  <span id="contact-title-${i}" class="name-meta"> NOTHING </span>
                              </div>
                              <div class="col-sm-4 col-xs-4 pull-right sideBar-time">
                                  <span id="contact-hour-${i}" class="time-meta pull-right"> NOTHING </span>
                              </div>
                          </div>
                        </div>
                      <div class="sideBar-main">
                        <div class="row">
                          <div class="col-sm-12 col-xs-12 sideBar-lastMessage">
                                <span id="contact-message-${i}" class="lastMessage-meta"> NOTHING </span>
                          </div> 
                        </div>
                      </div>
                    </div>
                `);

        if (conversations[i]._id == activeConversationId)
          $(`#contact-${i}`).addClass("selected");

        conversations[i].idcontact = i;
        // Conversation title
        let contactTitle = "";
        if (conversations[i].userId1 == null) contactTitle = "[Discussions]";
        else {
          if (conversations[i].encrypted) contactTitle += "🔒 ";
          if (conversations[i].userId1.username == myPseudo) {
            // ToDo: add real CSS to distinguish online users and encrypted chats
            if (onlineUsers.includes(conversations[i].userId2.username))
              contactTitle += "🟢 ";
            contactTitle += conversations[i].userId2.username;
          } else {
            if (onlineUsers.includes(conversations[i].userId1.username))
              contactTitle += "🟢 ";
            contactTitle += conversations[i].userId1.username;
          }
        }
        $(`#contact-title-${i}`).text(contactTitle);

        // Last message content
        if (conversations[i].lastMessageId) {
          if (conversations[i].lastMessageId.author == myPseudo)
            $(`#contact-message-${i}`).text(
              conversations[i].lastMessageId.content
            );
          else
            $(`#contact-message-${i}`).text(
              conversations[i].lastMessageId.author +
                ": " +
                conversations[i].lastMessageId.content
            );

          // Last message timestamp (displayed as date if message is old)
          let messageDate = new Date(
            parseInt(conversations[i].lastMessageId.time)
          ).getDate();
          if (messageDate == new Date().getDate())
            $(`#contact-hour-${i}`).text(
              convertTimestampToTime(conversations[i].lastMessageId.time)
            );
          else
            $(`#contact-hour-${i}`).text(
              convertTimestampToDate(conversations[i].lastMessageId.time)
            );
        } else {
          // New conversation
          $(`#contact-message-${i}`).text("New conversation");
          $(`#contact-hour-${i}`).text("-");
        }
      }

      // Add click events to contacts
      for (let i = 0; i < conversations.length; i++) {
        $(`#contact-${i}`).on("click", selectContact);
      }

      // ToDo: reactivate the if when everything is ok
      // if (stillEncrypted) {
      $("#contact-list").append(`
                <div class="row sideBar-alert-body">
                    <div class="sideBar-main-alert">
                        <div class="row">
                            <div class="col-sm-8 col-xs-8 sideBar-alert">
                                <span class="alert-meta"> 🔒 You have ${stillEncrypted} encrypted conversation(s) </span>
                            </div>
                            <div class="col-sm-8 col-xs-8 sideBar-alert">
                                <span class="alert-meta text-link-blue" onclick="AESKeysPopup()"> Click here to unlock them </span>
                            </div>
                        </div>
                    </div>
                </div>
                `);
      // }
    });
  });
}

function selectContact(e) {
  conversations.forEach((conv) => {
    if ("contact-" + conv.idcontact == e.currentTarget.id) {
      openChat(conv);
      return;
    }
  });
}

async function sendMessage() {
  if ($("#chat-box").val().length == 0) {
    console.log("No message to send");
    return;
  }

  let message = null;
  // If we are in an encrypted conversation: encrypt the message
  if (AESKeys.has(activeConversationId)) {
    let encrypted = CryptoJS.AES.encrypt(
      $("#chat-box").val(),
      AESKeys.get(activeConversationId)
    );
    message = new Message(
      activeConversationId,
      myPseudo,
      encrypted.toString(),
      new Date().getTime()
    );
  } else {
    // Otherwise: send directly
    message = new Message(
      activeConversationId,
      myPseudo,
      $("#chat-box").val(),
      new Date().getTime()
    );
  }

  socket.emit("newMessage", message);
  $("#chat-box").val("");
}

// Keep the scroll bar at the bottom with each added message
function updateScroll() {
  var messagesChat = document.getElementById("messages-chat");
  messagesChat.scrollTop = messagesChat.scrollHeight;
}

/// FIXED: Improved message rendering to fix timestamp alignment and scrolling
function renderMessages() {
  // Clear the messages container
  $("#messages-chat").empty();

  if (!(activeConversationId in messagesDict)) return;

  // Create a container for all messages
  const messagesContainer = document.createElement("div");
  messagesContainer.className = "messages-container";

  // Get messages from the current conversation
  let messagesArray = messagesDict[activeConversationId];
  let currentDate = null;

  for (let i = 0; i < messagesArray.length; i++) {
    var author = messagesArray[i].author;
    var messageDate = new Date(parseInt(messagesArray[i].time));
    var messageDay = messageDate.getDate();

    // Display the date at the first message or between two messages of different dates
    if (currentDate === null || currentDate !== messageDay) {
      currentDate = messageDay;
      let messageDateString = convertTimestampToDate(messagesArray[i].time);

      const dateDiv = document.createElement("div");
      dateDiv.className = "row message-body clearfix";
      dateDiv.innerHTML = `
        <div class="message-main">
          <span class="message-date">${messageDateString}</span>
        </div>
      `;
      messagesContainer.appendChild(dateDiv);
    }

    // Create message element
    const messageDiv = document.createElement("div");
    messageDiv.className = "row message-body clearfix";

    // Sent message (your messages)
    if (myPseudo == author) {
      messageDiv.innerHTML = `
        <div class="col-sm-12 message-main-sender">
          <span class="message-nick">${author}</span>
          <div class="sender">
            <div class="message-text">${messagesArray[i].content}</div>
            <span class="message-time">${convertTimestampToTime(messagesArray[i].time)}</span>
          </div>
        </div>
      `;
    }
    // Received message (other person's messages)
    else {
      messageDiv.innerHTML = `
        <div class="col-sm-12 message-main-receiver">
          <span class="message-nick">${author}</span>
          <div class="receiver">
            <div class="message-text">${messagesArray[i].content}</div>
            <span class="message-time">${convertTimestampToTime(messagesArray[i].time)}</span>
          </div>
        </div>
      `;
    }

    // Hide username if it's the same as the previous message and on the same day
    if (
      i > 0 &&
      messagesArray[i - 1].author === author &&
      new Date(parseInt(messagesArray[i - 1].time)).getDate() === messageDay
    ) {
      const usernameElement = messageDiv.querySelector(".message-nick");
      if (usernameElement) {
        usernameElement.style.display = "none";
      }
    }

    messagesContainer.appendChild(messageDiv);
  }

  // Append all messages to the chat container
  document.getElementById("messages-chat").appendChild(messagesContainer);

  // Scroll to the bottom of the chat
  updateScroll();
}

// Keep the scroll bar at the bottom with each added message
function updateScroll() {
  var messagesChat = document.getElementById("messages-chat");
  if (messagesChat) {
    messagesChat.scrollTop = messagesChat.scrollHeight;
  }
}

window.addEventListener("DOMContentLoaded", async (event) => {
  getUsername().then(function (data) {
    myPseudo = data.username;
    myId = data.id;
    // Display the username of the connected user
    $("#username").text(myPseudo);
  });

  await renderConversations();

  // Enter key linked to the send message button
  window.addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
      $("#send").click();
    }
  });

  // Link buttons to their functions
  $("#back-button").click(function () {
    $("#partie-gauche").slideToggle("fast");
  });

  $("#logout-button").on("click", function (event) {
    $("#logoutPopup").modal("show");
  });

  $("#add-contact-button").on("click", openAddContactPopup);

  // Add CSS fixes for message scrolling
  const style = document.createElement("style");
  style.textContent = `
        #messages-chat {
            overflow-y: auto !important;
            height: calc(100vh - 150px) !important;
            display: block !important;
            padding: 25px !important;
        }
        
        .messages-container {
            width: 100%;
            display: block;
        }
        
        .message-body {
            width: 100%;
            margin-bottom: 15px !important;
            clear: both;
            overflow: hidden;
        }
        
        .message-main-sender {
            float: right;
            max-width: 70%;
            text-align: right;
        }
        
        .message-main-receiver {
            float: left;
            max-width: 70%;
            text-align: left;
        }
        
        .sender {
            background-color: #007aff;
            color: white;
            border-radius: 18px 18px 4px 18px;
            padding: 10px 14px;
            display: inline-block;
            max-width: 100%;
            text-align: left;
        }
        
        .receiver {
            background-color: #1e1e24;
            color: #e0e0e0;
            border-radius: 18px 18px 18px 4px;
            padding: 10px 14px;
            display: inline-block;
            max-width: 100%;
            text-align: left;
        }
        
        .message-text {
            margin: 0;
            word-wrap: break-word;
            font-weight: 400;
            font-size: 15px;
        }
        
        .message-nick {
            display: block;
            font-size: 13px;
            color: #8e8e93;
            margin-bottom: 5px;
        }
        
        .message-time {
            display: block;
            font-size: 12px;
            color: #8e8e93;
            margin-top: 5px;
        }
        
        /* Make timestamp black for blue (sender) messages for better visibility */
        .message-main-sender .message-time {
            color: black;
        }
        
        .message-date {
            display: block;
            text-align: center;
            font-size: 13px;
            color: #8e8e93;
            margin: 15px 0;
            position: relative;
        }
        
        .message-date:before, .message-date:after {
            content: "";
            position: absolute;
            height: 1px;
            background-color: #2a2a32;
            top: 50%;
            width: calc(50% - 60px);
        }
        
        .message-date:before {
            left: 0;
        }
        
        .message-date:after {
            right: 0;
        }
        
        .clearfix:after {
            content: "";
            display: table;
            clear: both;
        }
    `;
  document.head.appendChild(style);
});

/* -------------------- Add conversation menu -------------------- */

function openAddContactPopup(event) {
  $("#addContactError").addClass("invisible");
  $("#addContactPopup").modal("show");

  // Confirm button for unencrypted conversation
  $("#addContactConfirm").on("click", async function (e) {
    e.preventDefault();

    // Check if the user entered a username
    if ($("#addContactInput").val().length == 0) {
      $("#addContactError").text(
        "Please enter the ID of the user you want to write to."
      );
      $("#addContactError").removeClass("invisible");
      return;
    }

    // POST Request
    const body = { username2: $("#addContactInput").val() };
    $("#addContactInput").val("");
    const res = await fetch("/api/chats/newConversation", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    res
      .json()
      .then((response) => {
        if (response.status === 200) {
          socket.emit("newConversation", {
            userId1: response.userId1,
            userId2: response.userId2,
          });
          $("#addContactPopup").modal("hide");
          $("#addContactConfirm").off("click");
        } else {
          $("#addContactError").text(response.error);
          $("#addContactError").removeClass("invisible");
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  // Encrypted conversation button
  $("#openEndToEndPopup").on("click", async function (e) {
    e.preventDefault();

    // Check if the user entered a username
    if ($("#addContactInput").val().length == 0) {
      $("#addContactError").text(
        "Please enter the ID of the user you want to write to."
      );
      $("#addContactError").removeClass("invisible");
      return;
    }

    // POST Request
    const body = { username2: $("#addContactInput").val() };
    // $("#addContactInput").val("");
    const res = await fetch("/api/chats/isDiffieHellmanable", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    res
      .json()
      .then((response) => {
        if (response.status === 200) {
          $("#addContactInput").val("");
          $("#openEndToEndPopup").off("click");
          $("#addContactPopup").modal("hide");
          processDiffieHellman(response);
        } else {
          $("#addContactError").text(response.error);
          $("#addContactError").removeClass("invisible");
        }
      })
      .catch((error) => console.error("Error:", error));
  });
}

socket.on("newConversation", async () => {
  await renderConversations();
});

/* -------------------- Diffie-Hellman -------------------- */

let senderSecret;

function processDiffieHellman(data) {
  $("#diffieHellmanPopup").modal({
    backdrop: "static",
    keyboard: false,
  });
  // ToDo: find a way to warn the user that if they leave, the protocol will be canceled (and emit a cancelDiffieHellman)

  // Popup buttons and result key placeholder
  $("#diffieHellmanError").addClass("invisible");
  $("#readyDiffieHellman").show();
  $("#cancelDiffieHellman").show();
  $("#terminateDiffieHellman").hide();
  $("#generatedSymKey").val("");

  $("#diffieHellmanPopup").modal("show");
  $("#otherUserDFProgress").text(`Click "I'm ready" to notify ${data.user2}`);
  // ToDo after DH authenticated: if keys are already entered: write them in publicKeyInput and privateKeyInput

  $("#cancelDiffieHellman").on("click", function (e) {
    e.preventDefault();
    socket.emit("cancelDiffieHellman", data.userId1, data.userId2);
    $("#diffieHellmanPopup").modal("hide");
    return;
  });

  $("#readyDiffieHellman").on("click", function (e) {
    e.preventDefault();
    $("#readyDiffieHellman").off("click");
    $("#otherUserDFProgress").text(`Waiting for ${data.user2}...`);
    // Calculate the public value A of DH
    let array = new Uint32Array(10);
    window.crypto.getRandomValues(array);
    senderSecret = array[0] % data.p;
    data.publicA = expmod(data.g, senderSecret, data.p);
    // Send data to the server for transfer to user2
    socket.emit("engageDiffieHellman", data);
  });
}

socket.on("acceptedDiffieHellman", async (data) => {
  // Remove both buttons
  $("#readyDiffieHellman").hide();
  $("#cancelDiffieHellman").hide();
  $("#terminateDiffieHellman").show();

  $("#otherUserDFProgress").text(
    `The encrypted conversation with ${data.user2} has been created.`
  );
  $("#diffieHellmanError").text(
    "Please save the symmetric key in a local key file before closing this window."
  );
  $("#diffieHellmanError").removeClass("invisible");
  let secretKey = expmod(data.publicB, senderSecret, data.p);

  // POST Request for conversation creation
  const body = { username2: data.user2 };
  const res = await fetch("/api/chats/newEncryptedConversation", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });

  res
    .json()
    .then((response) => {
      // Display conversation ID and symmetric key
      $("#generatedSymKey").val(
        `"${response.idChat}":  "${secretKey.toString(16)}", `
      );
      // Store the pair in Map
      AESKeys.set(response.idChat, secretKey.toString(16));
      // Send the new conversation to both parties
      socket.emit("newConversation", {
        userId1: response.userId1,
        userId2: response.userId2,
      });
    })
    .catch((error) => console.error("Error:", error));
});

socket.on("notifDiffieHellman", (data) => {
  $("#notifDHPopup").modal("show");
  $("#notifDHText").text(
    `${data.user1} wants to start a private conversation with you.`
  );

  $("#rejectDiffieHellman").on("click", function (e) {
    e.preventDefault();
    socket.emit("cancelDiffieHellman", data.userId1, data.userId2);
    $("#cancelDiffieHellman").off("click");
    $("#notifDHPopup").modal("hide");
    return;
  });

  $("#acceptDiffieHellman").on("click", async function (e) {
    e.preventDefault();
    // Calculate the public value B of DH
    let array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    let receiverSecret = array[0] % data.p;
    data.publicB = expmod(data.g, receiverSecret, data.p);
    socket.emit("acceptedDiffieHellman", data);

    $("#acceptDiffieHellman").off("click");
    await new Promise((r) => setTimeout(r, 1000));
    $("#notifDHPopup").modal("hide");
    finishDiffieHellman(data, receiverSecret);
    return;
  });
});

function finishDiffieHellman(data, receiverSecret) {
  let secretKey = expmod(data.publicA, receiverSecret, data.p);

  let idChat = null;
  conversations.forEach((conv) => {
    if (conv.userId1 != null) {
      if (
        (conv.userId1._id == data.userId1 &&
        conv.userId2._id == data.userId2) ||
        (conv.userId1._id == data.userId2 && conv.userId2._id == data.userId1)
      ) {
        idChat = conv._id;
      }
    }
  });

  $("#diffieHellmanPopup").modal({
    backdrop: "static",
    keyboard: false,
  });

  // Popup buttons
  $("#readyDiffieHellman").hide();
  $("#cancelDiffieHellman").hide();
  $("#terminateDiffieHellman").show();

  // ToDo: find a way to warn the user that if they leave, the protocol will be canceled (and emit a cancelDiffieHellman)
  $("#diffieHellmanPopup").modal("show");
  $("#otherUserDFProgress").text(
    `The encrypted conversation with ${data.user1} has been created.`
  );
  // Display conversation ID and symmetric key
  $("#generatedSymKey").val(`"${idChat}":  "${secretKey.toString(16)}", `);
  // Store the pair in Map
  AESKeys.set(idChat, secretKey.toString(16));
  $("#diffieHellmanError").text(
    "Please save the symmetric key in a local key file before closing this window."
  );
  $("#diffieHellmanError").removeClass("invisible");
  renderConversations();
}

socket.on("cancelDiffieHellman", () => {
  $("#otherUserDFProgress").text(`Diffie-Hellman protocol canceled.`);
  // ToDo: cancelDiffieHellman: say who canceled and close the window
});

/* -------------------- AES -------------------- */

function decryptAllMessages(idChat, key) {
  if (!(idChat in messagesDict))
    // No old messages in this conversation
    return;

  let messagesArray = messagesDict[idChat];
  for (let i = 0; i < messagesArray.length; i++) {
    messagesArray[i].content = CryptoJS.AES.decrypt(
      messagesArray[i].content,
      AESKeys.get(idChat)
    );
    messagesArray[i].content = messagesArray[i].content.toString(
      CryptoJS.enc.Utf8
    );
  }
}

// Popup for entering AES keys
function AESKeysPopup() {
  $("#AESKeysError").addClass("invisible");
  $("#AESKeysPopup").modal("show");

  $("#AESKeysConfirm").on("click", function (e) {
    $("#AESKeysError").addClass("invisible");
    e.preventDefault();

    if (!$("#AESKeysInput").val().length) {
      $("#AESKeysError").text("Please enter at least one AES key to validate.");
      $("#AESKeysError").removeClass("invisible");
    }
    // Parsing conversation IDs / AES keys
    const jsonRegExp = new RegExp('".+" *: *".+"'); // Regex "dfdf":"dsfsd"
    const parsed = $("#AESKeysInput").val().match(jsonRegExp)[0]; // ToDo: test this method
    console.log(parsed);

    if (parsed.length) {
      // Remove spaces
      let string = parsed.replace(/ /g, "").replace(/"/g, "");
      const keys = string.split(",");
      console.log(keys);
      for (const key of keys) {
        AESKeys.set(key.split(":")[0], key.split(":")[1]);
        // Decrypt chat messages
        decryptAllMessages(key.split(":")[0], key.split(":")[1]);
      }
      renderConversations();
      $("#AESKeysInput").val("");
      $("#AESKeysPopup").modal("hide");
    } else {
      $("#AESKeysError").text("The format is invalid.");
      $("#AESKeysError").removeClass("invisible");
    }
  });
}

/* -------------------- Logout menu -------------------- */

async function logout() {
  try {
    const res = await fetch("/api/users/logout", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();

    if (data.status === 200) {
      window.location = data.redirect;
    }
  } catch (err) {
    console.log(err.message);
  }
}

function homepage() {
  $("#menu_ajouter_conv").css("display", "none");
  $("#menu_deco").css("display", "none");

  $("#accueil").removeClass("hidden");
  $("#footer").removeClass("hidden");
  $("#chat").addClass("hidden");

  for (let i = 0; i < conversations.length; i++) {
    $(`contact-${i}`).removeClass("selected");
  }
}

function openChat(chat) {
  for (let i = 0; i < conversations.length; i++) {
    $(`#contact-${i}`).removeClass("selected");
  }
  $(`#contact-${chat.idcontact}`).addClass("selected");
  // Display the conversation on the right side while hiding the homepage
  $("#accueil").addClass("hidden");
  $("#footer").addClass("hidden");

  $("#header-chat").removeClass("hidden");
  $("#messages-chat").removeClass("hidden");
  $("#reply-chat").removeClass("hidden");

  // If XS screen: remove the left side when clicking on a contact
  if ($(window).width() < 768) {
    // $("#partie-gauche").addClass("hidden");
    $("#partie-gauche").slideToggle("fast"); // ToDo: do a slide left/right (cf. jquery-ui easing)
  }

  // Display the recipient's name
  activeConversationId = chat._id; // Set active conv ID
  if (chat.userId1 == null)
    $("#chat-name").text("[Discussions] – General channel");
  else if (chat.userId1.username == myPseudo)
    $("#chat-name").text(chat.userId2.username);
  else $("#chat-name").text(chat.userId1.username);

  // Display messages
  renderMessages();
}

function openGeneralChat() {
  for (let i = 0; i < conversations.length; i++) {
    $(`#contact-${i}`).removeClass("selected");
  }

  conversations.forEach((conv) => {
    if (conv.userId1 == null) {
      openChat(conv);
      return;
    }
  });
}
