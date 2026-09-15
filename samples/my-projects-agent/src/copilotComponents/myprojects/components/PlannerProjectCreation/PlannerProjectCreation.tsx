import * as React from 'react';
import {
  Button,
  Checkbox,
  Input,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  PortalMountNodeProvider,
  Spinner,
  tokens,
  webDarkTheme,
  webLightTheme,
} from '@fluentui/react-components';
import {
  Add24Regular,
  ArrowMaximize24Regular,
  PeopleTeam24Regular,
  TaskListSquareAdd24Regular,
} from '@fluentui/react-icons';
import {
  DropdownField,
  type IOption,
} from '@spteck/react-controls-v2/drop-down-field';
import { FluentUIProvider } from '@spteck/react-controls-v2/fluent-ui-provider';
import {
  ItemPicker,
  type IItemPickerOption,
} from '@spteck/react-controls-v2/item-picker';
import { SelectDay } from '@spteck/react-controls-v2/select-day';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';

import { useCopilotContentHeight } from '../../hooks/useCopilotContentHeight';
import { useInlineCopilotContentSize } from '../../hooks/useInlineCopilotContentSize';
import { useLockDocumentViewport } from '../../hooks/useLockDocumentViewport';
import { useMicrosoft365Groups } from '../../hooks/useMicrosoft365Groups';
import { usePlannerProjectCreation } from '../../hooks/usePlannerProjectCreation';
import type {
  IMicrosoft365Group,
  IPlannerProjectCreationProps,
  PlannerProjectTemplateKey,
} from '../../models';
import {
  PLANNER_PROJECT_TEMPLATE_KEYS,
  getPlannerProjectBlueprint,
  isPlannerProjectTemplateKey,
  isValidIsoDate,
  schedulePlannerBlueprintTasks,
} from '../../utils/plannerBlueprints';
import { usePlannerProjectCreationStyles } from './usePlannerProjectCreationStyles';

function formatString(template: string, values: string[]): string {
  return values.reduce(
    (current, value, index) => current.replace(`{${index}}`, value),
    template
  );
}

function formatIsoDate(isoDate: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

function parseIsoDate(isoDate: string): Date | undefined {
  if (!isValidIsoDate(isoDate)) {
    return undefined;
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date): string {
  const padDatePart = (value: number): string =>
    value < 10 ? `0${value}` : String(value);

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-');
}

function toPickerOption(group: IMicrosoft365Group): IItemPickerOption {
  return {
    media: <PeopleTeam24Regular />,
    secondaryText: group.mail ?? group.description,
    text: group.displayName,
    value: group.id,
  };
}

export function PlannerProjectCreation(
  props: IPlannerProjectCreationProps
): React.ReactElement {
  const styles = usePlannerProjectCreationStyles();
  const groups = useMicrosoft365Groups(props.graphClientFactory);
  const creation = usePlannerProjectCreation(props.graphClientFactory);
  const [projectName, setProjectName] = React.useState(
    props.properties.projectName
  );
  const [startDate, setStartDate] = React.useState(
    props.properties.startDate
  );
  const [template, setTemplate] = React.useState<PlannerProjectTemplateKey>(
    props.properties.template
  );
  const [assignToMe, setAssignToMe] = React.useState(
    props.properties.assignPlanningAndDevelopmentToMe === true &&
      Boolean(props.currentUserId)
  );
  const [selectedGroup, setSelectedGroup] =
    React.useState<IMicrosoft365Group>();
  const templateLabels: Record<PlannerProjectTemplateKey, string> = {
    basicPlan: props.strings.BasicPlanTemplateLabel,
    businessPlan: props.strings.BusinessPlanTemplateLabel,
    employeeOnboarding: props.strings.EmployeeOnboardingTemplateLabel,
    projectManagement: props.strings.ProjectManagementTemplateLabel,
    simplePlan: props.strings.SimplePlanTemplateLabel,
    softwareDevelopment: props.strings.SoftwareDevelopmentTemplateLabel,
  };
  const templateOptions: IOption[] = PLANNER_PROJECT_TEMPLATE_KEYS.map(
    (templateKey) => ({
      text: templateLabels[templateKey],
      value: templateKey,
    })
  );
  const selectedStartDate = React.useMemo(
    () => parseIsoDate(startDate),
    [startDate]
  );
  const blueprint = getPlannerProjectBlueprint(template);
  const groupOptions = groups.groups.map(toPickerOption);
  const selectedOptions = selectedGroup
    ? [toPickerOption(selectedGroup)]
    : [];
  const scheduledTasks = isValidIsoDate(startDate)
    ? schedulePlannerBlueprintTasks(blueprint, startDate)
    : [];
  const scheduleEndDate = scheduledTasks
    .reduce(
      (latestDate, task) =>
        task.dueDateTime > latestDate ? task.dueDateTime : latestDate,
      ''
    )
    .slice(0, 10);
  const result = creation.result;
  const isDraftLocked = creation.isCreating || result !== undefined;
  const isComplete =
    result?.status === 'created' || result?.status === 'alreadyExists';
  const canCreate =
    projectName.trim().length > 0 &&
    isValidIsoDate(startDate) &&
    selectedGroup !== undefined &&
    (!assignToMe || props.currentUserId !== undefined) &&
    !isComplete;
  const contentHeight = useCopilotContentHeight(
    props.targetDocument,
    props.isFullscreen
  );
  const inlineContentRef = useInlineCopilotContentSize({
    enabled: !props.isFullscreen,
    measurementKey: [
      groups.isLoading,
      groups.isLoadingMore,
      groups.error ?? '',
      selectedGroup?.id ?? '',
      template,
      result?.status ?? '',
      result?.error ?? '',
      creation.error ?? '',
    ].join(':'),
    onRequestSizeChange: props.onRequestSizeChange,
    targetDocument: props.targetDocument,
  });

  useLockDocumentViewport(props.targetDocument, props.isFullscreen);

  const selectGroup = (options: IItemPickerOption[]): void => {
    const option = options[0];

    setSelectedGroup(
      option
        ? {
            displayName: option.text,
            id: option.value,
            mail: option.secondaryText,
          }
        : undefined
    );
  };
  const createProject = async (): Promise<void> => {
    if (!selectedGroup || !canCreate) {
      return;
    }

    await creation.createProject({
      assignPlanningAndDevelopmentToMe: assignToMe,
      blueprint,
      currentUserId: props.currentUserId,
      groupId: selectedGroup.id,
      projectName,
      resumePlanId: result?.status === 'partial' ? result.planId : undefined,
      startDate,
    });
  };
  const openProject = async (): Promise<void> => {
    if (result) {
      await props.onOpenProject(result.planId, projectName.trim());
    }
  };
  const theme = props.isDarkTheme ? webDarkTheme : webLightTheme;

  return (
    <PortalMountNodeProvider value={props.targetDocument?.body}>
      <FluentUIProvider
        applicationName="my-planner-projects-"
        applyStylesToPortals
        targetDocument={props.targetDocument}
        theme={theme}
      >
        <StackV2
          className={styles.root}
          height={props.isFullscreen ? contentHeight : 'fit-content'}
          overflow="hidden"
        >
          <StackV2
            overflow={props.isFullscreen ? 'auto' : 'visible'}
            padding={props.isFullscreen ? 'xl' : 'm'}
            ref={inlineContentRef}
          >
            <StackV2 className={styles.content} gap="m">
              <StackV2 alignItems="center" direction="horizontal" gap="m">
                <StackV2
                  alignItems="center"
                  background={tokens.colorBrandBackground2}
                  height="40px"
                  justifyContent="center"
                  style={{
                    borderRadius: tokens.borderRadiusMedium,
                    color: tokens.colorBrandForeground1,
                    flex: '0 0 40px',
                  }}
                  width="40px"
                >
                  <TaskListSquareAdd24Regular />
                </StackV2>
                <StackV2 gap="xs">
                  <TypographyControl fontSize="xl" fontWeight="semibold">
                    {props.strings.CreateProjectReviewTitle}
                  </TypographyControl>
                  <TypographyControl
                    color={tokens.colorNeutralForeground2}
                    fontSize="s"
                  >
                    {props.strings.CreateProjectSafetyLabel}
                  </TypographyControl>
                </StackV2>
              </StackV2>

              <StackV2
                className={styles.reviewSurface}
                gap="l"
                padding="l"
              >
                <StackV2 direction="horizontal" gap="m" wrap>
                  <StackV2 className={styles.field} gap="xs">
                    <TypographyControl fontWeight="semibold">
                      {props.strings.ProjectNameLabel}
                    </TypographyControl>
                    <Input
                      aria-label={props.strings.ProjectNameLabel}
                      disabled={isDraftLocked}
                      maxLength={250}
                      onChange={(_event, data) => setProjectName(data.value)}
                      value={projectName}
                    />
                  </StackV2>
                  <StackV2 className={styles.field} gap="xs">
                    <TypographyControl fontWeight="semibold">
                      {props.strings.ProjectStartDateLabel}
                    </TypographyControl>
                    {isDraftLocked ? (
                      <TypographyControl>
                        {formatIsoDate(startDate, props.dateLocale)}
                      </TypographyControl>
                    ) : (
                      <SelectDay
                        locale={props.dateLocale}
                        onSelected={(date: Date) =>
                          setStartDate(toIsoDate(date))
                        }
                        value={selectedStartDate}
                      />
                    )}
                  </StackV2>
                </StackV2>

                <DropdownField
                  disabled={isDraftLocked}
                  label={
                    <TypographyControl fontWeight="semibold">
                      {props.strings.ProjectTemplateLabel}
                    </TypographyControl>
                  }
                  onChange={(selectedTemplate) => {
                    if (isPlannerProjectTemplateKey(selectedTemplate)) {
                      setTemplate(selectedTemplate);
                    }
                  }}
                  options={templateOptions}
                  value={template}
                />

                <StackV2 gap="xs">
                  <TypographyControl fontWeight="semibold">
                    {props.strings.GroupPickerLabel}
                  </TypographyControl>
                  <StackV2 onFocusCapture={groups.ensureFirstPage}>
                    <ItemPicker
                      disabled={isDraftLocked}
                      loadingMessage={props.strings.GroupPickerLoadingLabel}
                      loadingMoreMessage={
                        props.strings.GroupPickerLoadingMoreLabel
                      }
                      maxSelectedOptions={1}
                      noResultsMessage={
                        props.strings.GroupPickerNoResultsLabel
                      }
                      onLoadMore={groups.loadMore}
                      onSearchChange={groups.search}
                      onSelectionChange={selectGroup}
                      options={groupOptions}
                      pagingInfo={{
                        hasMore: groups.nextLink !== undefined,
                        isLoading: groups.isLoading,
                        isLoadingMore: groups.isLoadingMore,
                      }}
                      placeholder={props.strings.GroupPickerPlaceholder}
                      searchDebounceMs={300}
                      selectedOptions={selectedOptions}
                      tagMaxWidth={280}
                      width="100%"
                    />
                  </StackV2>
                  {groups.error && (
                    <MessageBar intent="error">
                      <MessageBarBody>
                        <TypographyControl>
                          {props.strings.GroupLoadErrorTitle}: {groups.error}
                        </TypographyControl>
                      </MessageBarBody>
                      <MessageBarActions>
                        <Button onClick={groups.retry}>
                          {props.strings.RetryButtonLabel}
                        </Button>
                      </MessageBarActions>
                    </MessageBar>
                  )}
                </StackV2>

                <StackV2
                  className={styles.blueprint}
                  gap="m"
                  padding="m"
                >
                  <TypographyControl fontSize="l" fontWeight="semibold">
                    {templateLabels[template]}
                  </TypographyControl>
                  <StackV2 direction="horizontal" gap="l" wrap>
                    <TypographyControl fontSize="s" fontWeight="semibold">
                      {props.strings.BlueprintBucketCountLabel.replace(
                        '{0}',
                        String(blueprint.buckets.length)
                      )}
                    </TypographyControl>
                    <TypographyControl fontSize="s" fontWeight="semibold">
                      {props.strings.BlueprintTaskCountLabel.replace(
                        '{0}',
                        String(blueprint.tasks.length)
                      )}
                    </TypographyControl>
                    {scheduleEndDate && (
                      <TypographyControl fontSize="s">
                        {formatString(props.strings.BlueprintScheduleLabel, [
                          formatIsoDate(startDate, props.dateLocale),
                          formatIsoDate(scheduleEndDate, props.dateLocale),
                        ])}
                      </TypographyControl>
                    )}
                  </StackV2>
                  <StackV2 direction="horizontal" gap="xs" wrap>
                    {blueprint.buckets.map((bucket) => (
                      <StackV2
                        className={styles.bucket}
                        key={bucket.key}
                        padding="xs"
                      >
                        <TypographyControl fontSize="s">
                          {bucket.name}
                        </TypographyControl>
                      </StackV2>
                    ))}
                  </StackV2>
                </StackV2>

                <Checkbox
                  checked={assignToMe}
                  disabled={!props.currentUserId || isDraftLocked}
                  label={
                    <TypographyControl>
                      {props.strings.AssignPlanningAndDevelopmentLabel}
                    </TypographyControl>
                  }
                  onChange={(_event, data) =>
                    setAssignToMe(data.checked === true)
                  }
                />

                {!props.currentUserId &&
                  props.properties.assignPlanningAndDevelopmentToMe && (
                    <MessageBar intent="warning">
                      <MessageBarBody>
                        <TypographyControl>
                          {props.strings.SelfAssignmentUnavailableLabel}
                        </TypographyControl>
                      </MessageBarBody>
                    </MessageBar>
                  )}

                {creation.error && (
                  <MessageBar intent="error">
                    <MessageBarBody>
                      <TypographyControl>
                        {props.strings.CreateProjectErrorTitle}:{' '}
                        {creation.error}
                      </TypographyControl>
                    </MessageBarBody>
                  </MessageBar>
                )}

                {result?.status === 'created' && (
                  <MessageBar intent="success">
                    <MessageBarBody>
                      <StackV2 gap="xs">
                        <TypographyControl fontWeight="semibold">
                          {props.strings.CreateProjectSuccessTitle}
                        </TypographyControl>
                        <TypographyControl>
                          {formatString(
                            props.strings.CreateProjectSuccessDescription,
                            [
                              String(result.createdBucketCount),
                              String(result.createdTaskCount),
                            ]
                          )}
                        </TypographyControl>
                      </StackV2>
                    </MessageBarBody>
                  </MessageBar>
                )}

                {result?.status === 'alreadyExists' && (
                  <MessageBar intent="info">
                    <MessageBarBody>
                      <StackV2 gap="xs">
                        <TypographyControl fontWeight="semibold">
                          {props.strings.ProjectAlreadyExistsTitle}
                        </TypographyControl>
                        <TypographyControl>
                          {props.strings.ProjectAlreadyExistsDescription}
                        </TypographyControl>
                      </StackV2>
                    </MessageBarBody>
                  </MessageBar>
                )}

                {result?.status === 'partial' && (
                  <MessageBar intent="warning">
                    <MessageBarBody>
                      <StackV2 gap="xs">
                        <TypographyControl fontWeight="semibold">
                          {props.strings.PartialProjectTitle}
                        </TypographyControl>
                        <TypographyControl>
                          {formatString(
                            props.strings.PartialProjectDescription,
                            [
                              String(result.createdBucketCount),
                              String(result.totalBucketCount),
                              String(result.createdTaskCount),
                              String(result.totalTaskCount),
                            ]
                          )}
                        </TypographyControl>
                        {result.error && (
                          <TypographyControl>{result.error}</TypographyControl>
                        )}
                      </StackV2>
                    </MessageBarBody>
                  </MessageBar>
                )}

                <StackV2
                  direction="horizontal"
                  gap="s"
                  justifyContent="flex-end"
                  wrap
                >
                  {result && (
                    <Button
                      appearance="secondary"
                      icon={<ArrowMaximize24Regular />}
                      onClick={openProject}
                    >
                      {props.strings.OpenCreatedProjectLabel}
                    </Button>
                  )}
                  {!isComplete && (
                    <Button
                      appearance="primary"
                      disabled={!canCreate || creation.isCreating}
                      icon={
                        creation.isCreating ? (
                          <Spinner size="tiny" />
                        ) : (
                          <Add24Regular />
                        )
                      }
                      onClick={createProject}
                    >
                      {result?.status === 'partial'
                        ? props.strings.ContinueProjectButtonLabel
                        : props.strings.CreateProjectButtonLabel}
                    </Button>
                  )}
                </StackV2>
              </StackV2>
            </StackV2>
          </StackV2>
        </StackV2>
      </FluentUIProvider>
    </PortalMountNodeProvider>
  );
}