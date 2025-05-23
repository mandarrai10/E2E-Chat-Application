const ws = new WebSocket("ws://localhost:8080");

var pseudo = "Random";

class Message {
    constructor(author, message, date) {
        this.author = author;
        this.message = message;
        this.date = date;
    }

    toString() {
        return `${this.date} | ${this.author} > ${this.message}`;
    }
}

function getTime() {
    let date = new Date();
    let milisec = Date.now();
    let seconds = milisec / 1000;
    let minutes = seconds / 60;
    minutes -= date.getTimezoneOffset();
    let hours = minutes / 60;
    let result = Math.floor(hours % 24) + ":" + Math.floor(minutes % 60);
    return result;
}

// What to do when the connection is established
ws.addEventListener("open", () => {
    alert("We are connected");
});

// What to do when the client receives a message from the server
ws.addEventListener("message", data => {
    let msg = JSON.parse(data.data);
    console.log(msg);
    let message = new Message(msg.author, msg.message, msg.date);
    addMessageInBox(message);
});

function addMessageInBox(message) {
    let messageBox = document.getElementById("messageBox");
    let newMessage = document.createElement("p");
    let messageNode = document.createTextNode(message.toString());
    newMessage.appendChild(messageNode);
    messageBox.appendChild(newMessage);
}

// Send the message written in the input after clicking the "Send" button
function sendMessage() {
    let messageInput = document.getElementById("messageInput");
    let message = new Message(pseudo, messageInput.value, getTime());
    ws.send(JSON.stringify(message));
    messageInput.value = '';
}

function chosePseudo() {
    let pseudoInput = document.getElementById("pseudoInput");
    pseudo = pseudoInput.value;
}
