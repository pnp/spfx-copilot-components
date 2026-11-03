import type { IIsoWeek } from '../logic/isoWeek';
import type { IQuizQuestion } from '../models';

export function getDemoQuestions(current: IIsoWeek): { quiz: IQuizQuestion; noJustification: IQuizQuestion; poll: IQuizQuestion } {
  return {
    quiz: {
      id: 101,
      title: 'How often is the company-wide newsletter sent out?',
      year: current.year,
      week: current.week,
      choices: [
        { key: 'A', text: 'Every Monday' },
        { key: 'B', text: 'Every other week' },
        { key: 'C', text: 'Every Thursday' },
        { key: 'D', text: 'Once a month' }
      ],
      correctChoice: 'C',
      justification:
        'The newsletter goes out every Thursday at 09:00 so it lands before the Friday team meetings. Past issues are on the News page.'
    },
    noJustification: {
      id: 102,
      title: 'Which floor is the new project room on?',
      year: current.year,
      week: current.week,
      choices: [
        { key: 'A', text: 'Ground floor' },
        { key: 'B', text: '2nd floor' },
        { key: 'C', text: '4th floor' }
      ],
      correctChoice: 'B',
      justification: ''
    },
    poll: {
      id: 103,
      title: 'Which topic should the next lunch-and-learn cover?',
      year: current.year,
      week: current.week,
      choices: [
        { key: 'A', text: 'Copilot tips' },
        { key: 'B', text: 'Export markets update' },
        { key: 'C', text: 'Wellbeing at work' },
        { key: 'D', text: 'Travel booking' }
      ],
      justification: ''
    }
  };
}
