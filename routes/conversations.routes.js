module.exports = (app) => {
    const {
        getConversations,
        newConversation,
        isDiffieHellmanable,
        newEncryptedConversation,
        updateConversation
    } = require("../controllers/conversations.controller.js");

    const router = require("express").Router();
    
    // Retrieve all conversations of a user
    router.get("/getConversations", getConversations);

    // Create a new conversation
    router.post("/newConversation", newConversation);

    // Check if a user can perform Diffie-Hellman encryption
    router.post("/isDiffieHellmanable", isDiffieHellmanable);
    
    // Create an encrypted conversation
    router.post("/newEncryptedConversation", newEncryptedConversation);

    // Update a conversation (Uncomment when needed)
    // router.post("/updateConversation", updateConversation);

    app.use('/api/chats', router);
};
