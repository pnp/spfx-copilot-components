import {
  PLANNER_PROJECT_TEMPLATE_KEYS,
  addDaysToIsoDate,
  getPlannerProjectBlueprint,
  isPlannerProjectTemplateKey,
  isValidIsoDate,
  schedulePlannerBlueprintTasks,
} from './plannerBlueprints';

describe('plannerBlueprints', () => {
  it('defines every supported basic plan choice', () => {
    expect(PLANNER_PROJECT_TEMPLATE_KEYS).toEqual([
      'basicPlan',
      'simplePlan',
      'projectManagement',
      'softwareDevelopment',
      'businessPlan',
      'employeeOnboarding',
    ]);

    for (const templateKey of PLANNER_PROJECT_TEMPLATE_KEYS) {
      const blueprint = getPlannerProjectBlueprint(templateKey);

      expect(blueprint.key).toBe(templateKey);
      expect(isPlannerProjectTemplateKey(templateKey)).toBe(true);
      expect(
        blueprint.tasks.every((task) =>
          blueprint.buckets.some((bucket) => bucket.key === task.bucketKey)
        )
      ).toBe(true);
    }

    expect(getPlannerProjectBlueprint('basicPlan')).toMatchObject({
      buckets: [],
      tasks: [],
    });
    expect(isPlannerProjectTemplateKey('premiumPlan')).toBe(false);
  });

  it('defines the software development phases and assignment scope', () => {
    const blueprint = getPlannerProjectBlueprint('softwareDevelopment');
    const assignedTasks = blueprint.tasks.filter(
      (task) => task.assignment === 'planningAndDevelopment'
    );

    expect(blueprint.buckets.map((bucket) => bucket.name)).toEqual([
      'Discovery and planning',
      'Development',
      'Validation',
      'Release',
    ]);
    expect(blueprint.tasks).toHaveLength(14);
    expect(assignedTasks).toHaveLength(10);
  });

  it('schedules tasks relative to the requested start date', () => {
    const blueprint = getPlannerProjectBlueprint('softwareDevelopment');
    const tasks = schedulePlannerBlueprintTasks(blueprint, '2026-09-07');

    expect(tasks[0].startDateTime).toBe('2026-09-07T09:00:00Z');
    expect(tasks[0].dueDateTime).toBe('2026-09-09T17:00:00Z');
    expect(tasks[tasks.length - 1].dueDateTime).toBe(
      '2026-10-14T17:00:00Z'
    );
  });

  it('handles month boundaries and rejects invalid dates', () => {
    expect(addDaysToIsoDate('2026-09-30', 1)).toBe('2026-10-01');
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
  });
});