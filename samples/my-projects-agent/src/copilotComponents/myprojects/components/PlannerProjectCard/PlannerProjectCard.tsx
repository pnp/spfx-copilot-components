import * as React from 'react';
import {
    Button,
    Card,
    CardHeader,


    tokens,
} from '@fluentui/react-components';
import { ArrowExpand20Regular, Open20Regular } from '@fluentui/react-icons';
import { StackV2 } from '@spteck/react-controls-v2/stack-v2';
import { TypographyControl } from '@spteck/react-controls-v2/typography-control';

import type { IPlannerProjectCardProps } from '../../models';
import { getPlannerPlanUrl } from '../../utils/plannerLinks';
import { PlannerProjectStatusBadges } from '../PlannerProjectStatusBadges/PlannerProjectStatusBadges';
import { Icon } from '@iconify/react';
import { CustomTooltip } from '@spteck/react-controls-v2/custom-tooltip';

export function PlannerProjectCard(
    props: IPlannerProjectCardProps
): React.ReactElement {
    const nextDueDate = props.project.nextDueDate
        ? new Intl.DateTimeFormat(props.dateLocale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(new Date(props.project.nextDueDate))
        : props.strings.NoDueDateLabel;
    const handleOpen = async (): Promise<void> => {
        await props.onOpen(props.project);
    };

    return (
        <Card  >
            <CardHeader
                image={<Icon icon={"thesvg-color:microsoft-planner"} width={32} height={32} />}
                header={
                    <TypographyControl fontSize="l" fontWeight="semibold">
                        {props.project.title}
                    </TypographyControl>
                }
                description={
                    <TypographyControl
                        color={tokens.colorNeutralForeground2}
                        fontSize="s"
                    >
                        {props.strings.NextDueLabel}: {nextDueDate}
                    </TypographyControl>
                }
                action={
                    <StackV2 direction="horizontal" gap="xs" alignItems="center">
                    <CustomTooltip content={props.strings.OpenPlannerWebLabel} relationship="label" theme={props.theme}>
                        <Button
                            as="a"
                            appearance="subtle"
                            aria-label={`${props.strings.OpenPlannerWebLabel}: ${props.project.title}`}
                            href={getPlannerPlanUrl(props.project.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            icon={<Open20Regular />}
                        />
                    </CustomTooltip>
                    <CustomTooltip content={props.strings.OpenProjectLabel} relationship="label" theme={props.theme}>
                        <Button
                            appearance="subtle"
                            aria-label={`${props.strings.OpenProjectLabel}: ${props.project.title}`}
                            icon={<ArrowExpand20Regular />}
                            onClick={handleOpen}
                        />
                    </CustomTooltip>
                    </StackV2>
                }
            />
            <StackV2 direction="horizontal" gap="s" padding="m" wrap>
                <PlannerProjectStatusBadges
                    project={props.project}
                    strings={props.strings}
                />
            </StackV2>
        </Card>
    );
}
