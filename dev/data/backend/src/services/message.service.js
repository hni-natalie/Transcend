const prisma = require('../../prisma/client');
const { uploadFile } = require('../services/supabase-storage.service');


function createDirectKey(userId1, userId2) {
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}:${sortedIds[1]}`;
}

function getAttachmentKind(mimeType) {
	if (mimeType.startsWith("image/"))
		return "image";
	return "pdf";
}

const messageService = {
	  async getAllConversations(userId) {		
		return prisma.conversation.findMany({
			// only return conversations where the user is a participant
			where: {
				participants: {
					some: {
						userId: userId
					}
				}
			},
			// include participants and the most recent message in each conversation
			include:{
				pins:{
					where: {
						userId: userId
					}
				},
				participants: {
					select: {
						userId: true,
						user: {
							select: {
								userId: true,
								userName: true,
								avatarUrl: true
							}
						}
					}
				},
				messages: {
					orderBy: {
						createdAt: 'desc'
					},
					take: 1
				},
			},
			// order by the most recently updated conversation first
			orderBy: {
				updatedAt: 'desc'
			}
		});
	},


	async getConversationById(conversationId, userId) {
		return prisma.conversation.findUnique({
			// only return the conversation if the user is a participant
			where: { 
				conversationId: conversationId,
				deletedAT: null,
				participants: {
					some: {
						userId: userId
					}
				}
			},
			// include participants and messages in the conversation
			select: {
				conversationId: true, 
				type: true, 
				avatarUrl: true,
				createdByUserId: true,
				createdAt: true,
				updatedAt: true,
				participants: {
					select: {
						userId: true,
						user: {
							select: {
								userId: true,
								userName: true,
								avatarUrl: true
							}
						}
					}
				},
			}
		});
	},

	async createDirectConversation(userId, participantId, workspaceId) {
		const directKey = createDirectKey(userId, participantId);
		return prisma.conversation.upsert({
			where: {
				directKey: directKey
			},
			// if a conversation with this directKey exists, do nothing
			update: {},
			// if it doesn't exist, create a new direct conversation with the two participants
			create: {
				type: 'direct',
				createdByUserId: userId,
				workspaceId: workspaceId,
				directKey: directKey,
				participants: {
					create: [
						{ userId: userId },
						{ userId: participantId }
					]
				}
			},
			include: {
				participants: {
					select: {
						userId: true,
						user: {
							select: {
								userId: true,
								userName: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		});
	},
	async createGroupConversation(userId, participantIds, groupName, workspaceId) { 
		return prisma.conversation.create({
			data: {
			type: "group",
			groupName,
			createdByUserId: userId,
			workspaceId,

			participants: {
				create: participantIds.map((participantUserId) => ({
				userId: participantUserId, })),
				},
			},

			include: {
			participants: {
				select: {
				userId: true,
				user: {
					select: {
					userId: true,
					userName: true,
					avatarUrl: true,
					},
				},
				},
			},
			},
		});
	},
	async deleteConversation(conversationId, userId) {
		return prisma.$transaction(async (tx) => {
			// check if the conversation exists and if the user is the creator
			const conversation = await tx.conversation.findFirst({
				where: { 
					conversationId: conversationId ,
					createdByUserId: userId
				},
				select: {
					conversationId: true,
					createdByUserId: true
				}
			});
		if (!conversation) {
			throw new Error('Conversation not found or user is not the creator');
		}
		return tx.conversation.delete({
			where: { conversationId: conversationId }
			});
		});
	},

	// Messages
	async getMessages(conversationId, userId) {
		console.log("Logged-in user ID:", userId);
		const conversation = await prisma.conversation.findFirst({
			where: {
				conversationId: conversationId,
				deletedAt: null,
				participants: {
					some: {
						userId,
					}
				}
			},
			select: {
				conversationId: true,
			}
			})
		if (!conversation) {
			throw new Error(
				"Conversation not found or user is not a participant"
			);
		}
		return prisma.message.findMany({
			where: {
				conversationId
			},
			orderBy: {
				createdAt: "asc"
			},
			select: {
				messageId: true,
				conversationId: true,
				text: true,
				createdAt: true,
				author: {
					select: {
						userId: true,
						userName:  true,
						avatarUrl:  true
					}
				},
				attachments: {
					select : {
						id:  true,
						name:  true,
						url:  true,
						createdAt:  true
					}
				}
			}})
		},

	async sendMessage(conversationId, userId, text) {
		const cleanText = typeof text === "string" ? text.trim() : "";
		if (!cleanText) {
			throw new Error("Message text is required")
		}
		return prisma.$transaction(async(tx) => {
			const conversation = prisma.conversation.findUnique({
				where: {
					conversationId: conversationId,
					deletedAt: null,
					participants: {
						some: {
							userId: userId,
						}
					}
				},
				select: {
					conversationId: true,
				}
			})
		if (!conversation) {
			throw new Error('Conversation not found or user is not the creator');
			}
		
		const message = await tx.message.create({
			data: {
				conversationId,
				authorId: userId,
				text: cleanText
			},
			select: {
				messageId: true,
				conversationId: true,
				text: true,
				createdAt: true,
				author: {
					select: {
						userId: true,
						userName:  true,
						avatarUrl:  true
					}
				},
				attachments: {
					select: {
						id:  true,
						name:  true,
						url:  true,
						createdAt:  true
					}
				}
			}})
		// update the conversation
		await tx.conversation.update({
			where: {
				conversationId
			},
			data: {
				updatedAt: new Date()
			}})
		return message;
		})},

	// Participants
	async addParticipant(conversationId, userId, participantIds) {
		
		if (!Array.isArray(participantIds) || participantIds.length === 0) {
			throw new Error ('participantIds must be a non-empty array');
		}

		const conversation = await prisma.conversation.findUnique({
			where: {
				conversationId
			},
			select: {
				type: true,
				deletedAt: true,
				createdByUserId: true,
				participants: {
					select: {
						userId: true
					}
				}
			}
		})

		if (!conversation || conversation.deletedAt)
			throw new Error("Conversation not found");

		if (conversation.type != "group")
			throw new Error ('Participants can only be added to group conversations');

		if (conversation.createdByUserId != userId)
			throw new Error ('Only the group creater and create conversation');

		// get the existing group member
		const existingParticipantIds = new Set(
			conversation.participants.map(
				(participant) => participant.userId
			)
		);
		// remove duplicate participant
		const participantIdsToAdd = [...new Set(participantIds)].filter(
			(participantUserId) => !existingParticipantIds.has(participantUserId)
			);
		
		if (!participantIdsToAdd || participantIdsToAdd.length === 0)
			throw new Error ('All selected users are already participants');

		return prisma.conversation.update({
			where: {
				conversationId
			},
			data: {
				participants: {
					create: participantIdsToAdd.map((participantUserId) => ({
					userId: participantUserId, })),
					},
			},
			include: {
				participants: {
					select: {
					userId: true,
					user: {
						select: {
						userId: true,
						userName: true,
						avatarUrl: true,
						},
					},
					},
				},
				},
			})
		
	},

	async removeParticipant(conversationId, userId, participantId) {
		const conversation = await prisma.conversation.findUnique({
			where: {
				conversationId
			},
			select: {
				type: true,
				deletedAt: true,
				createdByUserId: true
			}
		})
		console.log("author id", conversation.createdByUserId);

		if (!conversation || conversation.deletedAt)
			throw new Error('Conversation not found');

		if (conversation.type != "group")
			throw new Error ('Participants can only be removed from group conversations');

		if (conversation.createdByUserId != userId)
			throw new Error ('Only the group creater can remove participant');

		if (participantId == conversation.createdByUserId)
			throw new Error ('Group owner could not be removed')

		return prisma.conversationParticipant.deleteMany({
			where: {
				conversationId,
				userId: participantId
			}
		})
	},

	//Pin
	async pinConversation(userId, conversationId) {
		const conversation = await prisma.conversation.findUnique({
			where: {
				conversationId,
				deletedAt: null,
				participants: {
					some: {
						userId
					}
				}
			}
		})
		if (!conversation)
			throw new Error('Conversation not found or user is not a participant');
		
		return prisma.conversationPin.upsert({
			where: {
				userId_conversationId: {
					userId,
					conversationId
				}
			},
			update: {},
			create: {
				userId,
				conversationId
			},
			select: {
				pinId: true, 
				userId: true,
				conversationId: true,
				createdAt: true
			}
		})
	},

	async unpinConversation(userId, conversationId) {
		// check conversation exist or not
		const conversation = await prisma.conversation.findUnique({
			where: {
				conversationId,
				deletedAt: null,
				participants: {
					some: {
						userId
					}
				}
			}
		})
		if (!conversation)
			throw new Error('Conversation not found or user is not a participant');

		// confirm the conversation is pinned
		const pin = await prisma.conversationPin.findUnique({
			where: {
			userId_conversationId: {
				userId,
				conversationId,
			},
			},
		});
		if (!pin) {
			throw new Error('Conversation is not pinned');
		}
		
		return prisma.conversationPin.delete({
			where: {
				userId_conversationId: {
					userId,
					conversationId
				}
			},
			select: {
				pinId: true, 
				userId: true,
				conversationId: true,
				createdAt: true
			}
		})
	},

	//attachment
	async uploadAttachment(userId, messageId, file, customName) {
	const message = await prisma.message.findUnique({
		where: {
			messageId,
			conversation: {
				deletedAt: null,
				participants: {
					some: {
						userId
					}
				}
			}
		},
		select: {
			conversationId: true
		}
	})
	if (!message)
		throw new Error ('Message not found or user cannot access this conversation');
	const fileExt = file.originalname.split('.').pop();
	const fileName = `${userId}-${Date.now()}.${fileExt}`;
	const filePath = `chat/${message.conversationId}/${messageId}/${fileName}`;

	const publicUrl = await uploadFile(
		process.env.SUPABASE_PUBLIC_BUCKET,
		filePath,
		file.buffer,
		file.mimetype
	);

	return prisma.messageAttachment.create({
		data: {
			messageId,
			name: customName?.trim() || file.originalname,
			kind: getAttachmentKind(file.mimetype),
			url: publicUrl,
			path: filePath,
			mimeType: file.mimetype,
			sizeInBytes: file.size
		}})
	},

	async deleteAttachment(attachmentId) {
		const attachment = await prisma.messageAttachment.findUnique({
			where: {
				id: attachmentId
			}
		})
		if (!attachment)
			throw new Error ('Attachment not found');
		await prisma.messageAttachment.delete({
			where: {
				id: attachmentId
			}
		})
	}

}

module.exports = messageService;