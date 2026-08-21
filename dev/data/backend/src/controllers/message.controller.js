const messageService = require('../services/message.service');

const messageController = {
	async getAllConversations(req, res) {
		try {
			const { userId } = req.user;
			const conversations = await messageService.getAllConversations(userId);
			return res.json(conversations);
		} catch (error) {
			console.error('Error fetching conversations:', error);
			res.status(500).json({ error: 'Failed to fetch conversations' });
		}
	},

	async getConversationById(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			const conversation = await messageService.getConversationById(id, userId);
			return res.json(conversation);
		} catch (error) {
			if (error.message === 'Conversation not found') {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	},

	async createDirectConversation(req, res) {
		try {
			const { userId } = req.user;
			const { participantId } = req.body;
			const workspaceId = req.user.workspaceId;
			if (userId === participantId) {
				return res.status(400).json({ error: 'Cannot create a conversation with yourself' });
			}

			if (!participantId) {
				return res.status(400).json({ error: 'participantId is required' });
			}
			
			const conversation = await messageService.createDirectConversation(userId, participantId, workspaceId);
			console.log("conversation.created");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error creating direct conversation:', error);
			res.status(500).json({ error: 'Failed to create direct conversation' });
		}
	},

	async createGroupConversation(req, res) {
		try {
			const { userId } = req.user;
			const { participantIds, groupName } = req.body;
			const workspaceId = req.user.workspaceId;

			console.log("Logged-in user ID:", userId);
			if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
				return res.status(400).json({ error: 'participantIds must be a non-empty array' });
			}

			if (!groupName) {
				return res.status(400).json({ error: 'groupName is required' });
			}

			const conversation = await messageService.createGroupConversation(userId, participantIds, groupName, workspaceId);
			console.log("conversation.created");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error creating group conversation:', error);
			res.status(500).json({ error: 'Failed to create group conversation' });
		}
	},

	async deleteConversation(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			await messageService.deleteConversation(id, userId);
			console.log("conversation.deleted");
			return res.status(204).send();
		} catch (error) {
			if (error.message === 'Conversation not found') {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	},

	// Messages
	async getMessages(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			const messages = await messageService.getMessages(id, userId);
			return res.json(messages);
		} catch (error) {
			if (error.message === 'Conversation not found') {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	},

	async sendMessage(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const { text } = req.body;

			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!text) {
				return res.status(400).json({ error: "Message content required" });
			}

			const message = await messageService.sendMessage(id, userId, text);
			console.log("message.created");
			return res.status(201).json(message);
		} catch (error) {
			if (error.message === 'Conversation not found') {
				res.status(404).json({ error: error.message });
			} else {
				res.status(500).json({ error: error.message });
			}
		}
	},

	// Participants
	async addParticipant(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const { participantIds } = req.body;

			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!participantIds) {
				return res.status(400).json({ error: "Participant ID required" });
			}
			
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}
			
			const conversation = await messageService.addParticipant(id, userId, participantIds);
			console.log("participant.joined");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error adding participants:', error);
			res.status(500).json({ error: error.message})
		}
	},

	async removeParticipant(req, res) {
		try {
			const id = req.params.id;
			const participantId = req.params.userId;
			const userId = req.user.userId;

			console.log("Logged-in user ID:", userId);
			console.log("to remove user ID:", participantId);
			console.log("conversation ID:", id);
			
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!participantId) {
				return res.status(400).json({ error: "Participant ID required" });
			}
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}

			const conversation = await messageService.removeParticipant(id, userId, participantId);
			console.log("participant.removed");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error removing participant:', error);
			res.status(500).json({ error: error.message})
		}
	},

	// Pin

	async pinConversation(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}

			const conversationPin = await messageService.pinConversation(userId, id);
			console.log("conversation.pinned");
			return res.status(201).json(conversationPin);
		} catch (error) {
			console.error('Error pinning conversations:', error);
			res.status(500).json({ error: error.message})
		}
	},

	async unpinConversation(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}

			const conversationPin = await messageService.unpinConversation(userId, id);
			console.log("conversation.unpinned");
			return res.status(201).json(conversationPin);
		} catch (error) {
			console.error('Error unpinning conversations:', error);
			res.status(500).json({ error: error.message})
		}
	},

	// Attachment
	async uploadAttachment(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const file = req.file;

			if (!file)
				return res.status(400).json({ error: "A file is required" });
			if (!id) {
				return res.status(400).json({ error: "Message ID required" });
			}
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}
			const attachment = await messageService.uploadAttachment(userId, id, file, req.body.name);
			console.log("attachment.uplaoded");
			return res.status(201).json(attachment);
		} catch (error) {
			console.error('Error uploading attachment:', error);
			res.status(500).json({ error: error.message})
		}
	},
	async deleteAttachment(req, res) {
		try {
			const { id } = req.params;
			if (!id) {
				return res.status(400).json({ error: "Attachment ID required" });
			}
			await messageService.deleteAttachment(id);
			console.log("attachment.deleted");
			return res.json({ message: 'Attachment deleted successfully' });
		} catch (error) {
			console.error('Error deleting attachment:', error);
			res.status(500).json({ error: error.message})
		}
	},

	async markConversationRead(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}
			await messageService.markConversationRead(id, userId);
			return res.json({ message: 'Conversation marked as read' });
		} catch (error) {
			console.error('error marking conversation as read:', error);
			res.status(500).json({ error: error.message})
		}
	},
}

module.exports = messageController;