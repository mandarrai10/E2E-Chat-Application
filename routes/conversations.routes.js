module.exports = app => {
    const { getConversations, newConversation, isDiffieHellmanable, newEncryptedConversation, updateConversation } = require("../controllers/conversations.controller.js");
    var router = require("express").Router();

// Retrieves all conversations of a user
router.get("/getConversations", getConversations);

// Creates a new conversation
router.post("/newConversation", newConversation);

// Checks if a user is connected
router.post("/isDiffieHellmanable", isDiffieHellmanable);
    
// Creates an encrypted conversation
router.post("/newEncryptedConversation", newEncryptedConversation);

// Refreshes a conversation
    // router.post("/updateConversation", updateConversation);

    app.use('/api/chats', router);
};
