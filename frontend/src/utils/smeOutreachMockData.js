export const POINT_PEOPLE = ['Kristian', 'Marianne', 'Angel', 'Michael'];

export const SME_STATUSES = ['Draft', 'Sent', 'Waiting', 'Responded', 'No Reply'];

export const initialSmes = [
  {
    id: 'sme-1',
    name: 'Dr. Liza Fernandes',
    title: 'Senior Public Health Analyst',
    organization: 'Cebu City Health Office',
    pointPerson: 'Kristian',
    status: 'Draft',
    lastContactDate: '2026-02-25',
    notes: 'Open to interviews on Tuesdays, prefers email first.'
  },
  {
    id: 'sme-2',
    name: 'Engr. Paolo Mendoza',
    title: 'GIS Program Lead',
    organization: 'Metro Data Lab',
    pointPerson: 'Marianne',
    status: 'Waiting',
    lastContactDate: '2026-02-27',
    notes: 'Requested a one-page research brief before sharing data scope.'
  },
  {
    id: 'sme-3',
    name: 'Atty. Bea Soliven',
    title: 'Policy Advisor',
    organization: 'Open Governance PH',
    pointPerson: 'Angel',
    status: 'Responded',
    lastContactDate: '2026-03-01',
    notes: 'Available for a 30-minute call next week.'
  },
  {
    id: 'sme-4',
    name: 'Prof. Ramon Cruz',
    title: 'Data Ethics Researcher',
    organization: 'UP School of Statistics',
    pointPerson: 'Michael',
    status: 'No Reply',
    lastContactDate: '2026-02-18',
    notes: 'Follow-up needed if no response by end of week.'
  }
];

export const initialTemplates = [
  {
    id: 'template-intro',
    templateName: 'Initial Interview Request',
    content:
      'Hi [SME_NAME],\n\nI hope you are doing well. My name is [SENDER_NAME], and I am part of the KrisBan research team. We would like to request a short interview regarding your work at [ORGANIZATION].\n\nYour perspective as [SME_TITLE] would greatly help our study.\n\nBest regards,\n[SENDER_NAME]'
  },
  {
    id: 'template-data',
    templateName: 'Data Access Request',
    content:
      'Hello [SME_NAME],\n\nThis is [SENDER_NAME] from KrisBan. We are currently compiling project references and would like to request publicly shareable datasets or documentation from [ORGANIZATION].\n\nWe last reached out on [LAST_CONTACT_DATE] and would appreciate any update when convenient.\n\nThank you,\n[SENDER_NAME]'
  },
  {
    id: 'template-followup',
    templateName: 'Follow-up Outreach',
    content:
      'Hi [SME_NAME],\n\nI am following up on my previous message regarding our interview/data request with [ORGANIZATION].\n\nIf easier, we can adjust the scope or timing based on your availability.\n\nThanks again,\n[SENDER_NAME]'
  }
];