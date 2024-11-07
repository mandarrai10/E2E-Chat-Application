const User = require("../model/user");
const Conversation = require("../model/conversation");
const Crypto = require("./crypto.controller");

exports.getConversations = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "You must be logged in to view your conversations." });
	try {
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const conversations = await Conversation.find({
			$and: [
				{ $or: [{ userId1: user._id }, { userId2: user._id }, { userId1: null }] }
			]
		})
			.populate("lastMessageId", "author content time")
			.populate("userId1", "username")
			.populate("userId2", "username")

		// Tri des conversations par timestamp du dernier message
		// ToDo: classer en premier une conversation qui n'a pas de dernier message
		conversations.sort(function (a, b) {
			if (a.lastMessageId && b.lastMessageId)
				return b.lastMessageId.time - a.lastMessageId.time
		});

		res.status(200).json({ chats: conversations });
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};

exports.newConversation = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "You must be logged in to view your conversations." });
	try {
		const { username2 } = req.body;
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });
		if (!user2)
			return res.status(410).json({ error: "User not found. Unable to create a conversation." });
		if (user.username == user2.username)
			return res.status(411).json({ error: "You cannot create a conversation with yourself." });

		// Vérifier que la conversation n'existe pas déjà 
		const already = await Conversation.findOne(
			{
				$or: [
					{ $and: [{ userId2: user.id }, { userId1: user2.id }, { encrypted: false }] },
					{ $and: [{ userId1: user.id }, { userId2: user2.id }, { encrypted: false }] }
				]
			}
		)
		if (already) // ToDo: renvoyer l'ID de la conversation pour l'ouvrir (agira comme recherche)
			return res.status(411).json({ error: "This conversation already exists", convId: already._id });

		await Conversation.create({
			userId1: user.id,
			userId2: user2.id,
			lastMessageId: null,
			encrypted: false
		});

		return res.status(200).send({ status: 200, userId1: user.id, userId2: user2.id });
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};

exports.isDiffieHellmanable = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "You must be logged in to view your nickname." });
	try {
		const { username2 } = req.body;
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });
		if (!user2)
			return res.status(410).json({ error: "User not found. Unable to create a conversation" });
		if (user.username == user2.username)
			return res.status(411).json({ error: "You cannot create a conversation with yourself." });

		// Vérifier que la conversation n'existe pas déjà 
		const already = await Conversation.findOne(
			{
				$or: [
					{ $and: [{ userId1: user.id }, { userId2: user2.id }, { encrypted: true }] },
					{ $and: [{ userId2: user.id }, { userId1: user2.id }, { encrypted: true }] }
				]
			}
		)
		if (already)
			return res.status(411).json({ error: "This conversation already exists!", convId: already._id });

		if (!user2.status)
			return res.status(411).json({ error: "The user must be logged in to initiate a Diffie-Hellman exchange and create an end-to-end encrypted conversation." });


		return res.status(200).send({
			status: 200,
			user1: user.username, user2: user2.username,
			userId1: user.id, userId2: user2.id,
			p: Crypto.p, g: Crypto.g
		});
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};


exports.newEncryptedConversation = async (req, res, next) => {
	try {
		const { username2 } = req.body;
		const user = await User.findOne({ token: req.cookies.jwt });
		const user2 = await User.findOne({ usernamelowercase: username2.toLowerCase() });

		const conv = await Conversation.create({
			userId1: user.id,
			userId2: user2.id,
			lastMessageId: null,
			encrypted: true
		});

		return res.status(200).send({ status: 200, userId1: user.id, userId2: user2.id, idChat: conv._id });
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};

exports.updateConversation = async (req, res, next) => {
	if (!req.cookies.jwt)
		return res.status(403).json({ message: "Not successful", error: "You must be logged in to view your nickname" });
	try {
		const user = await User.findOne({ token: req.cookies.jwt });
		if (!user)
			return res.status(409).json({ error: "User not found. Please logout and re-login.", username: "Undefined" });

		const { message } = req.body;
		const update = { lastMessageId: message._id };
		await Conversation.findOneAndUpdate({ _id: message.idchat }, update);

		return res.status(200).json({ message: "Update effectué" });
	} catch (err) {
		res.status(401).json({ message: "Not successful", error: err.message })
	}
};
