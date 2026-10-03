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
    validateRenameGroup,
} = require('../validators/message.validator');

const { validateAttachment, validateAvatar } = require('../validators/file.validator');

function handleServiceError(res, error, fallbackMessage) {

	console.log('ERROR:', error);
	console.log('statusCode:', error.statusCode);
	console.log('typeof statusCode:', typeof error.statusCode);
	
    if (error.statusCode) {
        return res.status(Number(error.statusCode)).json({
            error: error.message
        });
    }

    console.error(error);

    return res.status(500).json({
        error: fallbackMessage
    });
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
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			try {
				validateAvatar(req.file);
			} catch (validationErr) {
				return res.status(400).json({
					error: validationErr.message
				});
			}

			const result =
				await messageService.uploadGroupAvatar(
					conversationId,
					userId,
					req.file,
					process.env.SUPABASE_ASSET_BUCKET
				);

			getIO().emit('messageUpdated');

			return res.json({
				success: true,
				...result
			});

		} catch (error) {
			if (
				error.message === 'No file uploaded' ||
				error.message === 'Conversation is not a group'
			) {
				return res.status(400).json({
					error: error.message
				});
			}

			return handleServiceError(
				res,
				error,
				'Failed to upload group avatar'
			);
		}
	},

	async deleteConversation(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			await messageService.deleteConversation(
				id,
				userId
			);

			getIO().emit('messageUpdated');

			return res.status(204).send();

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to delete conversation'
			);
		}
	},

	// Rename group
	async renameGroup(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			let validated;
			try {
				validated = validateRenameGroup(req.body);
			} catch (validationErr) {
				return res.status(400).json({ error: validationErr.message });
			}

			await messageService.updateGroupName(id, userId, validated.groupName);
			console.log('group.renamed:', id);
			getIO().emit('messageUpdated');
			return res.json({ success: true, groupName: validated.groupName });
		} catch (error) {
			if (error.message.includes('not found') || error.message.includes('not the group creator')) {
				return res.status(403).json({ error: error.message });
			}
			console.error('Error renaming group:', error);
			return res.status(500).json({ error: 'Failed to rename group' });
		}
	},

	// Messages
	async getMessages(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			const messages =
				await messageService.getMessages(
					id,
					userId
				);

			return res.json(messages);

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to fetch messages'
			);
		}
	},

	async sendMessage(req, res) {
		try {
			const { text, attachments = [] } = req.body;
			const { userId } = req.user;

			let conversationValidated;

			try {
				conversationValidated =
					validateConversationId(req.params.id);
			} catch (validationErr) {
				return res.status(400).json({
					error: validationErr.message
				});
			}

			let validated;

			try {
				validated = validateSendMessage(text);
			} catch (validationErr) {
				return res.status(400).json({
					error: validationErr.message
				});
			}

			const hasText =
				typeof text === 'string' &&
				text.trim().length > 0;

			const hasAttachments =
				Array.isArray(attachments) &&
				attachments.length > 0;

			if (!hasText && !hasAttachments) {
				return res.status(400).json({
					error:
						'Message text or attachment is required'
				});
			}

			const message =
				await messageService.sendMessage(
					conversationValidated.conversationId,
					userId,
					validated.text,
					attachments
				);

			const participantIds =
				await messageService.getConversationParticipantIds(
					conversationValidated.conversationId
				);

			const update = {
				conversationId:
					conversationValidated.conversationId,
				message
			};

			participantIds.forEach((participantId) => {
				getIO()
					.to(`user:${participantId}`)
					.emit('messageUpdated', update);
			});

			return res.status(201).json(message);

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to send message'
			);
		}
	},
	
	// Participants
	async addParticipant(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const { userIds } = req.body;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			if (!userIds) {
				return res.status(400).json({
					error: 'User IDs required'
				});
			}

			const conversation =
				await messageService.addParticipant(
					id,
					userId,
					userIds
				);

			getIO().emit('messageUpdated');

			return res.status(201).json(conversation);

		} catch (error) {
			if (
				error.message ===
					'participantIds must be a non-empty array' ||
				error.message ===
					'Participants can only be added to group conversations' ||
				error.message ===
					'All selected users are already participants'
			) {
				return res.status(400).json({
					error: error.message
				});
			}

			return handleServiceError(
				res,
				error,
				'Failed to add participants'
			);
		}
	},

	async removeParticipant(req, res) {
		try {
			const { id } = req.params;
			const participantId = req.params.userId;
			const userId = req.user.userId;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			if (!participantId) {
				return res.status(400).json({
					error: 'Participant ID required'
				});
			}

			const conversation =
				await messageService.removeParticipant(
					id,
					userId,
					participantId
				);

			getIO().emit('messageUpdated');

			return res.status(201).json(conversation);

		} catch (error) {
			if (
				error.message ===
				'Participants can only be removed from group conversations'
			) {
				return res.status(400).json({
					error: error.message
				});
			}

			return handleServiceError(
				res,
				error,
				'Failed to remove participant'
			);
		}
	},

	// Pin

	async pinConversation(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			const conversationPin =
				await messageService.pinConversation(
					userId,
					id
				);

			return res.status(201).json(
				conversationPin
			);

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to pin conversation'
			);
		}
	},

	async unpinConversation(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			const conversationPin =
				await messageService.unpinConversation(
					userId,
					id
				);

			return res.status(200).json(
				conversationPin
			);

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to unpin conversation'
			);
		}
	},

	// Attachment
	async uploadAttachment(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;
			const file = req.file;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			if (!file) {
				return res.status(400).json({
					error: 'File is required'
				});
			}

			try {
				validateAttachment(file);
			} catch (validationErr) {
				return res.status(400).json({
					error: validationErr.message
				});
			}

			const attachment =
				await messageService.uploadAttachment(
					userId,
					id,
					file
				);

			return res.status(201).json(attachment);

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to upload attachment'
			);
		}
	},

	async deleteAttachment(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			if (!id) {
				return res.status(400).json({
					error: 'Attachment ID required'
				});
			}

			await messageService.deleteAttachment(
				id,
				userId
			);

			return res.json({
				message:
					'Attachment deleted successfully'
			});

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to delete attachment'
			);
		}
	},

	async markConversationRead(req, res) {
		try {
			const { id } = req.params;
			const { userId } = req.user;

			if (!id) {
				return res.status(400).json({
					error: 'Conversation ID required'
				});
			}

			await messageService.markConversationRead(
				id,
				userId
			);

			return res.json({
				message: 'Conversation marked as read'
			});

		} catch (error) {
			return handleServiceError(
				res,
				error,
				'Failed to mark conversation as read'
			);
		}
	},
}

module.exports = messageController;
