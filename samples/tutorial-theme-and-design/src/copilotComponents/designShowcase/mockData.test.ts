import { PROJECTS, type IProject, type ProjectStatus } from './mockData';

describe('PROJECTS', () => {
  it('has a unique id for every project', () => {
    const ids: string[] = PROJECTS.map((project: IProject) => project.id);

    expect(new Set(ids).size).toBe(PROJECTS.length);
  });

  it('has a due date in the YYYY-MM-DD format for every project', () => {
    PROJECTS.forEach((project: IProject) => {
      expect(project.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('shows every status in the first four projects', () => {
    const statuses: ProjectStatus[] = PROJECTS.slice(0, 4).map(
      (project: IProject) => project.status
    );

    expect(statuses.slice().sort()).toEqual(['atRisk', 'blocked', 'done', 'onTrack']);
  });
});
