const messageService = require('../services/message.service');
const { getIO } = require("../services/socket.service");
const path = require('path');
const {
    validateCreateDirectConversation,
    validateCreateGroupConversation,
    validateSendMessage,
    validateAddParticipant,
    validateRemoveParticipant,
    validateConversationId,
    validateAttachmentId,
} = require('../validators/message.validator');

const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif'];
const ACCEPTED_MIME_TYPES = [
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'image/png',
	'image/jpeg',
	'image/gif'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;


function validateAttachment(file) {
	if (!file)
		throw new Error('File is required');

	if (!ACCEPTED_FILE_EXTENSIONS.includes(path.extname(file.originalname).toLowerCase()))
		throw new Error('Invalid file type');

	if (!ACCEPTED_MIME_TYPES.includes(file.mimetype))
		throw new Error('Invalid file type');

	if (file.size > MAX_FILE_SIZE) 
		throw new Error('File size exceeds the limit');
}


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

	async createDirectConversation(req, res) {
		try {
			// const { userId } = req.user;
			// const { participantId } = req.body;
			// const workspaceId = req.user.workspaceId;
			// if (userId === participantId) {
			// 	return res.status(400).json({ error: 'Cannot create a conversation with yourself' });
			// }

			// if (!participantId) {
			// 	return res.status(400).json({ error: 'participantId is required' });
			// }
			
			let validated;
            try {
                validated = validateCreateDirectConversation(req.body);
            } catch (validationErr) {
                return res.status(400).json({ error: validationErr.message });
            }

            const { userId } = req.user;
            if (userId === validated.participantId) {
                return res.status(400).json({ error: 'Cannot create a conversation with yourself' });
            }

            const workspaceId = req.user.workspaceId;
            const conversation = await messageService.createDirectConversation(
                userId,
                validated.participantId,
                workspaceId
            );
			
			// const conversation = await messageService.createDirectConversation(userId, participantId, workspaceId);
			console.log("conversation.created");
			getIO().emit("messageUpdated");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error creating direct conversation:', error);
			res.status(500).json({ error: 'Failed to create direct conversation' });
		}
	},

	async createGroupConversation(req, res) {
		try {
			// const { userId } = req.user;
			// const { participantIds, groupName, avatarUrl } = req.body;
			// const workspaceId = req.user.workspaceId;

			// console.log("Logged-in user ID:", userId);
			// if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
			// 	return res.status(400).json({ error: 'participantIds must be a non-empty array' });
			// }

			// if (!groupName) {
			// 	return res.status(400).json({ error: 'groupName is required' });
			// }

			let validated;
            try {
                validated = validateCreateGroupConversation(req.body);
            } catch (validationErr) {
                return res.status(400).json({ error: validationErr.message });
            }

            const { userId } = req.user;
            const workspaceId = req.user.workspaceId;

            console.log("Logged-in user ID:", userId);
            const conversation = await messageService.createGroupConversation(
                userId,
                validated.participantIds,
                validated.groupName,
                workspaceId,
                validated.avatarUrl
            );

			// const conversation = await messageService.createGroupConversation(userId, participantIds, groupName, workspaceId, avatarUrl);
			console.log("conversation.created");
			getIO().emit("messageUpdated");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error creating group conversation:', error);
			res.status(500).json({ error: 'Failed to create group conversation' });
		}
	},

	async uploadGroupAvatar(req, res) {
		try {
			const conversationId = req.params.id;
			const { userId } = req.user;

			if (!conversationId) {
				return res.status(400).json({ error: 'Conversation ID required' });
			}

			if (!req.file) {
				return res.status(400).json({ error: 'No file uploaded' });
			}

			const result = await messageService.uploadGroupAvatar(
				conversationId,
				userId,
				req.file,
				process.env.SUPABASE_ASSET_BUCKET
			);

			console.log('group.avatar.uploaded:', conversationId);
			getIO().emit('messageUpdated');
			return res.json({ success: true, ...result });
		} catch (error) {
			if (error.message === 'No file uploaded') {
				return res.status(400).json({ error: error.message });
			}
			if (error.message.includes('Conversation not found') || error.message.includes('cannot access')) {
				return res.status(404).json({ error: error.message });
			}
			console.error('Group avatar upload error:', error);
			return res.status(500).json({ error: error.message });
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
			getIO().emit("messageUpdated");
			return res.status(204).send();
		} catch (error) {
			if (error.message === 'Conversation not found') {
				res.status(404).json({ error: error.message });
			} else {
				console.error('Error deleting conversation:', error);
            	return res.status(500).json({ error: 'Failed to delete conversation' });
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
				console.error('Error fetching messages:', error);
				res.status(500).json({ error: 'Failed to fetch messages' });
			}
		}
	},

	async sendMessage(req, res) {
		try {
		// 	const { id } = req.params; // conversationId
		// 	const { userId } = req.user;
		// 	const { text, attachments = [] } = req.body;

		// 	if (!id) {
		// 		return res.status(400).json({
		// 			error: "Conversation ID required"
		// 		});
		// 	}
		// 	const hasText = typeof text === "string" && text.trim().length > 0;
		// 	const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

		// 	if (!hasText && !hasAttachments) {
		// 		return res.status(400).json({ error: "Message text or attachment is required"});
		// 	}

		// 	const message = await messageService.sendMessage(id, userId, text, attachments);

            let conversationValidated;
            try {
                conversationValidated = validateConversationId(req.params.id);
            } catch (validationErr) {
                return res.status(400).json({ error: validationErr.message });
            }

            let validated;
            try {
                validated = validateSendMessage(req.body);
            } catch (validationErr) {
                return res.status(400).json({ error: validationErr.message });
            }

            const { userId } = req.user;
            const message = await messageService.sendMessage(
                conversationValidated.conversationId,
                userId,
                validated.text,
                req.body.attachments || []
            );
			
			console.log("message.created");
			getIO().emit("messageUpdated");
			return res.status(201).json(message);

		} catch (error) {
			if (error.message === "Conversation not found or user is not a participant") {
				return res.status(404).json({error: error.message});
			}
			console.error('Error sending message:', error);
			return res.status(500).json({ error: 'Failed to send message' });
		}
	},

	
	// Participants
	async addParticipant(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const { userIds } = req.body;
			console.log("userIds:", userIds);

			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!userIds) {
				return res.status(400).json({ error: "User IDs required" });
			}
			
			if (!userId) {
				return res.status(400).json({ error: "User ID required" });
			}
			
			const conversation = await messageService.addParticipant(id, userId, userIds);
			console.log("participant.joined");
			getIO().emit("messageUpdated");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error adding participants:', error);
            return res.status(500).json({ error: 'Failed to add participants' });
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
			getIO().emit("messageUpdated");
			return res.status(201).json(conversation);
		} catch (error) {
			console.error('Error removing participant:', error);
			return res.status(500).json({ error: 'Failed to remove participant' });
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
			return res.status(500).json({ error: 'Failed to pin conversation' });
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
			return res.status(500).json({ error: 'Failed to unpin conversation' });
		}
	},

	// Attachment
	async uploadAttachment(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const file = req.file;

			if (!id) {
				return res.status(400).json({ error: "Conversation ID required" });
			}
			if (!file) {
				return res.status(400).json({ error: "File is required"});
			}

			try {
				validateAttachment(file);
			} catch (error) {
				return res.status(400).json({ error: error.message });
			}
			const attachment = await messageService.uploadAttachment(userId, id, file);

			return res.status(201).json(attachment);
		} catch (error) {
			console.error("Error uploading attachment:", error);
			return res.status(500).json({ error: 'Failed to upload attachment' });
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
			return res.status(500).json({ error: 'Failed to delete attachment' });
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
			return res.status(500).json({ error: 'Failed to mark conversation as read' });
		}
	},
}

module.exports = messageController;