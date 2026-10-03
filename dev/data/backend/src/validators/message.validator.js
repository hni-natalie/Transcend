const {
    isNonEmptyString,
    isValidId,
    hasValue,
    validateText,
    validateId,
} = require('./common.validator');

const { ForbiddenError } = require('../utils/errors');

const MAX_GROUP_NAME_LENGTH = 25;
const MAX_MESSAGE_LENGTH = 2000;

function validateCreateDirectConversation({ participantId }) {
    if (!isNonEmptyString(participantId))
        throw new Error('Participant ID is required');

    validateId(participantId, 'participantId');

    return {
        participantId: participantId.trim(),
    };
}

function validateCreateGroupConversation({ participantIds, groupName, avatarUrl }) {
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0)
        throw new Error('Participant IDs must be a non-empty array');

    participantIds.forEach((id, index) => {
        if (!isValidId(id)) {
            throw new Error(`Invalid participant ID at index ${index}`);
        }
    });

    if (!isNonEmptyString(groupName))
        throw new Error('Group name is required');

    validateText(groupName, 'Group name', MAX_GROUP_NAME_LENGTH, true);

    if (hasValue(avatarUrl)) {
        if (typeof avatarUrl !== 'string' || avatarUrl.length > 2048)
            throw new Error('Invalid avatar URL');
    }

    return {
        participantIds: participantIds.map(id => id.trim()),
        groupName: groupName.trim(),
        avatarUrl: hasValue(avatarUrl) ? avatarUrl : undefined,
    };
}

function validateSendMessage( text ) {
    if (!isNonEmptyString(text)) {
        return {
            text: null,
        };
    }

    validateText(text, 'Message text', MAX_MESSAGE_LENGTH, true);

    return {
        text: text.trim(),
    };
}

function validateConversationId(conversationId) {
    if (!isNonEmptyString(conversationId))
        throw new Error('Conversation ID is required');

    validateId(conversationId, 'conversationId');
    return { conversationId: conversationId.trim() };
}

function validateConversationAuthorization(conversation, userId) {
    if (conversation.createdByUserId !== userId)
        throw new ForbiddenError();
}

function validateConversationMemberAuthorization(conversation, userId) {
    const isMember = conversation.participants.some(
        participant =>
            participant.userId === userId 
    );

    if (!isMember) {
        throw new ForbiddenError();
    }
}

module.exports = {
    MAX_GROUP_NAME_LENGTH,
    MAX_MESSAGE_LENGTH,

    validateCreateDirectConversation,
    validateCreateGroupConversation,
    validateSendMessage,
    validateConversationId,
    validateConversationAuthorization,
    validateConversationMemberAuthorization
};