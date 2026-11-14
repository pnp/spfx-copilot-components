import type { IZavaLearningAssignment } from '../models/zavaOne';
import { dateOnlyAtDayOffset } from '../utils/evergreenDates';

export const zavaLearningAssignments: readonly IZavaLearningAssignment[] = [
  {
    id: 'learn-data-care', title: 'Protecting customer information',
    description: 'Practice Zava data-handling decisions through five short customer scenarios.',
    dueDate: dateOnlyAtDayOffset(6), durationMinutes: 18, required: true, status: 'inProgress', progress: 42,
    topics: ['Data responsibility', 'Customer trust']
  },
  {
    id: 'learn-accessible-collaboration', title: 'Accessible collaboration',
    description: 'Build meetings, documents, and presentations that work for more people from the start.',
    dueDate: dateOnlyAtDayOffset(13), durationMinutes: 24, required: true, status: 'notStarted', progress: 0,
    topics: ['Accessibility', 'Collaboration']
  },
  {
    id: 'learn-security-moments', title: 'Security in everyday moments',
    description: 'Recognize suspicious requests and use Zava reporting channels with confidence.',
    dueDate: dateOnlyAtDayOffset(20), durationMinutes: 15, required: true, status: 'notStarted', progress: 0,
    topics: ['Security', 'Responsible work']
  }
];