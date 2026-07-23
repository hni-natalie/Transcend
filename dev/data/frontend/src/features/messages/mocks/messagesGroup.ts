import type { DayGroup } from '../types';

const MOCK_CONID = 'mock-group-1';

export const groupDayGroups: DayGroup[] = [
  {
    id: 'group-day-1',
    label: '6 July 2026',
    messages: [
      {
        id: 'g-msg-1',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-06T09:15:00',
        text: 'Good morning team! Quick reminder about the sprint planning meeting at 10am.',
      },
      {
        id: 'g-msg-2',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-06T09:20:00',
        text: "I've updated the Jira board with all the tickets for this sprint. Please review before the meeting.",
        link: { url: 'https://jira.company.com/sprint/board' },
      },
      {
        id: 'g-msg-3',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-06T09:35:00',
        text: "Just pushed the latest design updates to Figma. Here's the link:",
        link: { url: 'https://figma.com/file/design-updates' },
        attachments: [
          {
            id: 'g-att-1',
            name: 'Design System v2.fig',
            kind: 'image',
            size: '4.2 MB',
            sizeInBytes: 4404019,
            url: 'https://storage.example.com/design-system.fig',
            createdAt: '2026-07-06T09:35:00',
            mimeType: 'image/x-figma',
          },
        ],
      },
      {
        id: 'g-msg-4',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-06T09:45:00',
        text: "Thanks everyone! I'll prepare the demo for the client presentation later today.",
      },
      {
        id: 'g-msg-5',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-06T10:00:00',
        callNote: 'Sprint planning meeting started — 45 minutes.',
        text: 'Meeting is now live. Join link:',
        link: { url: 'https://meet.google.com/abc-defg-hij' },
      },
    ],
  },
  {
    id: 'group-day-2',
    label: '7 July 2026',
    messages: [
      {
        id: 'g-msg-6',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-07T14:20:00',
        text: 'Just completed the code review for the authentication module. All tests are passing!',
        attachments: [
          {
            id: 'g-att-2',
            name: 'Auth Module Tests Results.pdf',
            kind: 'pdf',
            size: '856 KB',
            sizeInBytes: 876544,
            url: 'https://storage.example.com/auth-tests.pdf',
            createdAt: '2026-07-07T14:20:00',
            mimeType: 'application/pdf',
          },
        ],
      },
      {
        id: 'g-msg-7',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-07T15:30:00',
        text: "Great work everyone on the sprint! I've created the retrospective document. Please add your feedback:",
        link: { url: 'https://docs.google.com/document/d/retro' },
      },
      {
        id: 'g-msg-8',
        conversationId: MOCK_CONID,
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-07T16:45:00',
        text: 'Deployment to staging is complete. Everyone can test the new features at:',
        link: { url: 'https://staging.company.com' },
      },
    ],
  },
];

export const groupAllAttachments = groupDayGroups.flatMap((day) => day.messages.flatMap((message) => message.attachments ?? []));

export const groupAllLinks = groupDayGroups.flatMap((day) => day.messages.flatMap((message) => (message.link ? [message.link] : [])));
