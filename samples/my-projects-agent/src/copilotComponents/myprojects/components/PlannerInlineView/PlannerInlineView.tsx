import * as React from 'react';
import {
    Button,
    MessageBar,
    MessageBarBody,
    Spinner,

} from '@fluentui/react-components';
import { ArrowSync20Regular } from '@fluentui/react-icons';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';
import type {
    IMyprojectsCopilotComponentProperties,
    IMyprojectsStrings,
    IPlannerInlineViewProps,
} from '../../models';
import { PlannerEmptyState } from '../PlannerEmptyState/PlannerEmptyState';
import { PlannerProjectCard } from '../PlannerProjectCard/PlannerProjectCard';
import { CustomTooltip } from '@spteck/react-controls-v2/custom-tooltip';

function getTitle(
    query: IMyprojectsCopilotComponentProperties,
    strings: IMyprojectsStrings
): string {
    if (query.assignedToMe) {
        return strings.AssignedToMeProjectsTitle;
    }

    if (query.dateRange || query.fromDate || query.toDate) {
        return strings.FilteredProjectsTitle;
    }

    switch (query.view) {
        case 'active':
            return strings.ActiveProjectsTitle;
        case 'urgent':
            return strings.UrgentProjectsTitle;
        case 'overdue':
            return strings.OverdueProjectsTitle;
        case 'onHold':
            return strings.OnHoldProjectsTitle;
        default:
            return strings.AllProjectsTitle;
    }
}

function getEmptyMessage(
    query: IMyprojectsCopilotComponentProperties,
    strings: IMyprojectsStrings
): string {
    if (query.assignedToMe || query.dateRange || query.fromDate || query.toDate) {
        return strings.EmptyFilteredProjectsLabel;
    }

    switch (query.view) {
        case 'active':
            return strings.EmptyActiveProjectsLabel;
        case 'urgent':
            return strings.EmptyUrgentProjectsLabel;
        case 'overdue':
            return strings.EmptyOverdueProjectsLabel;
        case 'onHold':
            return strings.EmptyOnHoldProjectsLabel;
        default:
            return strings.EmptyProjectsLabel;
    }
}

export function PlannerInlineView(
    props: IPlannerInlineViewProps
): React.ReactElement {

    return (
        <StackV2 gap="m" padding="m" ref={props.rootRef}  >
            <StackV2
                alignItems="center"
                direction="horizontal"
                justifyContent="space-between"
            >
                <StackV2 gap="xs">
                    <TypographyControl fontSize="l" fontWeight="semibold">
                        {getTitle(props.query, props.strings)}
                    </TypographyControl>
                    {!props.isLoading && !props.error && (
                        <TypographyControl fontSize="s">
                            {props.strings.ProjectCountLabel.replace(
                                '{0}',
                                String(props.projects.length)
                            )}
                        </TypographyControl>
                    )}
                </StackV2>
                <CustomTooltip content={props.strings.RefreshButtonLabel} relationship="label" theme={props.theme}>
                    <Button
                        appearance="subtle"
                        aria-label={props.strings.RefreshButtonLabel}
                        icon={<ArrowSync20Regular />}
                        onClick={props.onRefresh}
                    />
                </CustomTooltip>
            </StackV2>

            {props.isLoading ? (
                <StackV2 alignItems="center" justifyContent="center" padding="l">
                    <Spinner label={props.strings.LoadingProjectsLabel} size="medium" />
                </StackV2>
            ) : props.error ? (
                <MessageBar intent="error">
                    <MessageBarBody>
                        <TypographyControl>
                            {props.strings.ErrorTitle}: {props.error}
                        </TypographyControl>
                    </MessageBarBody>
                </MessageBar>
            ) : props.projects.length === 0 ? (
                props.hasAnyProjects ? (
                    <TypographyControl>
                        {getEmptyMessage(props.query, props.strings)}
                    </TypographyControl>
                ) : (
                    <PlannerEmptyState
                        strings={props.strings}
                        targetDocument={props.targetDocument}
                    />
                )
            ) : (
                <StackV2 gap="s">
                    {props.projects.map((project) => (
                        <PlannerProjectCard
                            dateLocale={props.dateLocale}
                            key={project.id}
                            onOpen={props.onOpen}
                        project={project}
                        strings={props.strings}
                        theme={props.theme}
                    />
                    ))}
                </StackV2>
            )}
        </StackV2>
    );
}
