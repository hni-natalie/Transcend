import type { DayGroup } from '../types';

const MOCK_CONID = 'mock-direct-1';

export const dayGroups: DayGroup[] = [
  {
    id: 'day-1',
    label: '6 July 2026',
    messages: [
      {
        conversationId: MOCK_CONID,
        id: 'msg-1',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-06T10:11:00',
        text:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nQuisque cursus nisl accumsan nisi semper, sed fringilla libero vehicula. Etiam elementum ultrices lorem, eget lacinia felis vestibulum sed. In lacinia feugiat ex id pharetra. Suspendisse vitae lorem vel urna ullamcorper laoreet. Cras eu lorem tristique, pellentesque tortor a, semper arcu.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-2',
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-06T16:36:00',
        callNote: 'Test user started a call — 34 minutes.',
        link: { url: 'https://google.com' },
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-3',
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-06T14:20:00',
        text:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque cursus nisl accumsan nisi semper, sed fringilla libero vehicula. Etiam elementum ultrices lorem, eget lacinia felis vestibulum sed. In lacinia feugiat ex id pharetra. Suspendisse vitae lorem vel urna ullamcorper laoreet. Cras eu lorem tristique, pellentesque tortor a, semper arcu.',
      },
    ],
  },
  {
    id: 'day-2',
    label: '7 July 2026',
    messages: [
      {
        conversationId: MOCK_CONID,
        id: 'msg-4',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-07T09:49:00',
        attachments: [
          {
            id: 'att-1',
            name: 'Quarterly Report Q3.pdf',
            kind: 'pdf',
            size: '2.4 MB',
            sizeInBytes: 2516582,
            url: 'https://storage.example.com/report.pdf',
            createdAt: '2026-07-07T09:49:00',
            mimeType: 'application/pdf',
          },
          {
            id: 'att-2',
            name: 'Design System Overview.png',
            kind: 'image',
            size: '1.2 MB',
            sizeInBytes: 1258291,
            url: 'https://storage.example.com/design.png',
            createdAt: '2026-07-07T09:49:00',
            mimeType: 'image/png',
          },
          {
            id: 'att-3',
            name: 'Meeting Notes - Sprint Planning.docx',
            kind: 'document',
            size: '856 KB',
            sizeInBytes: 876544,
            url: 'https://storage.example.com/notes.docx',
            createdAt: '2026-07-07T09:49:00',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-5',
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-07T11:15:00',
        link: { url: 'https://github.com/your-repo' },
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-6',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-07T13:45:00',
        attachments: [
          {
            id: 'att-4',
            name: 'Dashboard Mockup.jpg',
            kind: 'image',
            size: '3.1 MB',
            sizeInBytes: 3250586,
            url: 'https://storage.example.com/dashboard.jpg',
            createdAt: '2026-07-07T13:45:00',
            mimeType: 'image/jpeg',
          },
        ],
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-7',
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-07T15:30:00',
        callNote: 'Test user started a call — 15 minutes.',
        link: { url: 'https://figma.com/file/design-file' },
        text: 'Updated the project timeline and assigned tasks to all team members. Everyone is aligned on the deliverables.',
      },
    ],
  },
  {
    id: 'day-3',
    label: '8 July 2026',
    messages: [
      {
        conversationId: MOCK_CONID,
        id: 'msg-8',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-08T10:11:00',
        attachments: [
          {
            id: 'att-5',
            name: 'Project Presentation.pptx',
            kind: 'document',
            size: '5.6 MB',
            sizeInBytes: 5872026,
            url: 'https://storage.example.com/presentation.pptx',
            createdAt: '2026-07-08T10:11:00',
            mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
          {
            id: 'att-6',
            name: 'Code Review Checklist.pdf',
            kind: 'pdf',
            size: '8 KB',
            sizeInBytes: 8192,
            url: 'https://storage.example.com/checklist.pdf',
            createdAt: '2026-07-08T10:11:00',
            mimeType: 'application/pdf',
          },
        ],
        text:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque cursus nisl accumsan nisi semper, sed fringilla libero vehicula. Etiam elementum ultrices lorem, eget lacinia felis vestibulum sed. In lacinia feugiat ex id pharetra. Suspendisse vitae lorem vel urna ullamcorper laoreet. Cras eu lorem tristique, pellentesque tortor a, semper arcu.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-9',
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-08T16:36:00',
        callNote: 'Test user started a call — 34 minutes.',
        link: { url: 'https://notion.so/your-docs' },
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-10',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-08T14:20:00',
        link: { url: 'https://jira.your-company.com/board' },
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
    ],
  },
  {
    id: 'day-4',
    label: '9 July 2026',
    messages: [
      {
        conversationId: MOCK_CONID,
        id: 'msg-11',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-09T10:11:00',
        attachments: [
          {
            id: 'att-7',
            name: 'User Research Findings.pdf',
            kind: 'pdf',
            size: '4.8 MB',
            sizeInBytes: 5033165,
            url: 'https://storage.example.com/research.pdf',
            createdAt: '2026-07-09T10:11:00',
            mimeType: 'application/pdf',
          },
        ],
        text:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque cursus nisl accumsan nisi semper, sed fringilla libero vehicula. Etiam elementum ultrices lorem, eget lacinia felis vestibulum sed. In lacinia feugiat ex id pharetra. Suspendisse vitae lorem vel urna ullamcorper laoreet. Cras eu lorem tristique, pellentesque tortor a, semper arcu.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-12',
        author: '',
        authorId: '',
        isSelf: true,
        createdAt: '2026-07-09T16:36:00',
        callNote: 'Test user started a call — 34 minutes.',
        link: { url: 'https://confluence.your-company.com/wiki' },
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
      {
        conversationId: MOCK_CONID,
        id: 'msg-13',
        author: '',
        authorId: '',
        isSelf: false,
        createdAt: '2026-07-09T14:20:00',
        link: { url: 'https://your-company.slack.com/channels/general' },
        text:
          'Cras a malesuada nisl.\nNulla vel quam venenatis, congue diam laoreet, commodo purus.\nInteger hendrerit elementum lacus, id aliquet diam vestibulum vehicula.',
      },
    ],
  },
];
