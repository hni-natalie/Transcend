### handover notes

### Data Model

```text
Workspace
    |
    +-- Conversation
            |
            +-- ConversationParticipant
            |
            +-- Message
                    |
                    +-- MessageAttachment

User
    |
    +-- ConversationParticipant
    +-- Message
    +-- ConversationPin
```

**Conversation types:** `direct` | `group`

---

### Key Rules

#### Direct Conversations

* **One conversation per user pair** — `userA + userB` and `userB + userA` must resolve to the same conversation
* Use a `directKey`: sort both user IDs → `"id1:id2"` → store as unique

#### Group Conversations

* Multiple participants
* Users **cannot voluntarily leave** a group conversation
* Participants can only be removed by another participant
* Removed users keep their existing message history
* Track membership with `joinedAt` / `removedAt`
* When a participant is removed, set `removedAt` instead of deleting the `ConversationParticipant` record
* Removed users no longer have active access to the conversation
* Removed users cannot send new messages
* Rejoining is only possible if the user is invited/added again
* Rejoining: update `removedAt = null` and reuse the existing `ConversationParticipant` record
* Any current participant can add or remove other participants
* A participant cannot remove themselves

#### Conversation Deletion

* Only the **conversation owner** can permanently delete a conversation
* Permanently deleting a conversation deletes:

  * The conversation
  * All messages
  * All message attachments
  * All participant records associated with the conversation
* Other participants cannot permanently delete the conversation
* Removing a conversation from a user's own conversation list is **not** the same as permanently deleting the conversation

#### Messages

* Author cannot be changed after creation
* No editing
* Users cannot delete individual messages
* Messages are deleted when their parent conversation is permanently deleted

#### Pins

* Per-user (User A pinning ≠ User B seeing it pinned)
* API: `POST/DELETE /conversations/:id/pin`

#### Attachments

* Private - stored in Supabase private bucket
* Use signed URLs with conversation access verification
* Supported kinds: `pdf` | `image` | `document`
* BE handles file size/type validation

#### Conversation Ordering

* Sort by `updatedAt DESC`
* New message → update `conversation.updatedAt`

#### Read State

* Track read state using `lastReadAt` per participant
* Unread message counts are required
* Update `lastReadAt` when the user opens the conversation
* No per-message read receipts

---

### BE API Endpoints

```text
// Conversations
GET     /conversations                          ← List all
GET     /conversations/:id                      ← Get one
POST    /conversations/direct                   ← Create direct
POST    /conversations/group                    ← Create group
DELETE  /conversations/:id                      ← Permanently delete (owner only)

// Participants
POST    /conversations/:id/participants         ← Add members
DELETE  /conversations/:id/participants/:userId ← Remove member

// Note: No /leave endpoint.
// Users cannot voluntarily leave group conversations.

// Messages
GET     /conversations/:id/messages             ← Fetch messages
POST    /conversations/:id/messages             ← Send message

// Pins
POST    /conversations/:id/pin                  ← Pin conversation
DELETE  /conversations/:id/pin                  ← Unpin conversation

// Attachments
POST    /messages/:id/attachments               ← Upload attachment
DELETE  /attachments/:id                         ← Delete attachment
```

**Important:**

* `DELETE /conversations/:id` is a **permanent deletion**
* Only the conversation owner can perform this action
* This action permanently deletes the conversation and its associated messages/attachments
* A participant cannot use this endpoint to simply remove the conversation from their own sidebar
* If per-user archive/hide functionality is needed in the future, implement it separately

---

### Real-Time Events

```text
message.created

conversation.created
conversation.updated
conversation.deleted

participant.joined
participant.removed

conversation.pinned
conversation.unpinned
```

Payload includes enough data for FE to update without refetching.

#### Participant Removal

When a participant is removed:

* Set `ConversationParticipant.removedAt`
* Emit `participant.removed`
* Removed user loses active access to the conversation
* Removed user cannot send new messages
* Existing messages authored by the removed user remain
* The conversation remains available to other active participants
* Removed user can only regain access if invited/added again
* When re-added, set `removedAt = null` on the existing `ConversationParticipant` record

#### Conversation Deletion

When the owner permanently deletes a conversation:

* Emit `conversation.deleted`
* Delete the conversation and associated data
* Delete all messages
* Delete all message attachments
* Remove the conversation from all participants' active conversation lists
* The conversation cannot be recovered

---

### Unique Constraints

| Table                   | Constraint                                      |
| ----------------------- | ----------------------------------------------- |
| ConversationParticipant | `@@unique([conversationId, userId])`            |
| ConversationPin         | `@@unique([userId, conversationId])`            |
| Conversation (direct)   | `directKey` unique (consider workspace scoping) |

---

### Implementation Order

1. **Database** — Finalize schema, add all models
2. **Authorization** — Ownership & access checks
3. **Conversation APIs** — CRUD, participants, pins
4. **Message APIs** — Send, fetch, attachments
5. **Real-time** — Events for all changes
6. **FE Integration** — Replace mocks with real API

---

### Questions / KIV

* Are group conversations editable? — no
* Can group names be changed? — no
* Can group avatars be changed? — no, default or set at create new message form
* Is there a group admin/owner? — no
* What happens to a removed user's message history? — messages are preserved
* Can a removed user access the conversation? — no, unless re-added
* Can a user permanently delete a conversation? — yes, but only the conversation owner
* What happens when the owner permanently deletes a conversation? — conversation, messages, attachments, and participant records are permanently deleted
* Can a non-owner participant permanently delete a conversation? — no
* Can users edit messages? — no
* Can users delete messages? — only via permanently deleting the conversation
* Can admins delete messages? — no
* Are deleted messages recoverable? — no
* Real-time technology? — can check Supabase Realtime / socket
* Max file size? — follow Supabase Storage limit, BE to verify config
* Allowed file types? — follow Supabase Storage type restrictions, BE to verify config
* Attachments public or private? — private
* Signed URLs for attachments? — yes
* File retention? — until conversation is permanently deleted
* Can one message have multiple links? — no, `Message.linkUrl` currently supports one detected URL per message. A conversation can contain links across multiple messages.
* KIV - Call / Video (Direct) and Set Meeting (Group) can be removed if complex
