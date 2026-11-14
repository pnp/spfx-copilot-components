import * as React from "react"
import {
  Title2,
  Subtitle1,
  Body1,
  Caption1,
  Badge,
  Button,
  Divider,
  MessageBar,
  MessageBarBody,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import {
  Building24Regular,
  PeopleTeam24Regular,
  Mail24Regular,
  Info24Regular,
  CalendarClock24Regular,
  Payment24Regular,
} from "@fluentui/react-icons"
import { Fade, Slide, Stagger } from "@fluentui/react-motion-components-preview"

import { WEEKDAY_LABEL, WEEKDAY_ORDER } from "../../models"
import {
  getDataService,
  getOpenStatus,
  todayWeekdayInZone,
} from "../../services"
import { useDataQuery } from "../../hooks/useDataQuery"
import ErrorState from "../common/ErrorState"
import LoadingState from "../common/LoadingState"
import CuisineIcon from "../common/CuisineIcon"
import IconChip from "../common/IconChip"
import OpenStatusBadge from "../cafeterias/OpenStatusBadge"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
  },
  headerCta: {
    marginLeft: "auto",
  },
  factStrip: {
    display: "flex",
    alignItems: "center",
    // justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  factDivider: {
    height: "16px",
    flexGrow: 0.05,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXXS,
  },
  sectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: tokens.spacingHorizontalM,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    boxSizing: "border-box",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  hoursTable: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  hoursRow: {
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    borderRadius: tokens.borderRadiusMedium,
  },
  hoursRowToday: {
    backgroundColor: tokens.colorNeutralBackground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  hoursTime: {
    justifySelf: "end",
    textAlign: "right",
  },
  cuisineRow: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  paymentRow: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
  },
})

export interface ICafeteriaDetailsViewProps {
  cafeteriaId: string
  onViewMenu: (cafeteriaId: string) => void
}

export default function CafeteriaDetailsView(
  props: ICafeteriaDetailsViewProps,
): React.ReactElement {
  const styles = useStyles()
  const { cafeteriaId, onViewMenu } = props

  const query = useDataQuery(
    () => getDataService().getCafeteriaDetails({ cafeteriaId }),
    [cafeteriaId],
  )

  const cafeteria = query.data
  const status = cafeteria ? getOpenStatus(cafeteria) : undefined
  const todayWeekday = cafeteria
    ? todayWeekdayInZone(cafeteria.timeZone)
    : undefined

  return (
    <div className={styles.root}>
      {query.loading && <LoadingState rows={4} />}
      {query.error && (
        <ErrorState message="We couldn't load this cafeteria's details right now." />
      )}
      {!query.loading && !query.error && !cafeteria && (
        <ErrorState
          title='Not found'
          message='This cafeteria could not be found.'
        />
      )}

      {cafeteria && (
        <Fade visible appear key={cafeteria.id}>
          <div className={styles.root}>
            <div className={styles.titleRow}>
              <IconChip hue='brand'>
                <Building24Regular />
              </IconChip>
              <Title2>{cafeteria.title}</Title2>
              <OpenStatusBadge cafeteria={cafeteria} />
              <Button
                className={styles.headerCta}
                appearance='primary'
                icon={<CalendarClock24Regular />}
                onClick={() => onViewMenu(cafeteria.id)}
              >
                View today&apos;s menu
              </Button>
            </div>

            {status?.closureNotice && (
              <MessageBar intent='warning' icon={<Info24Regular />}>
                <MessageBarBody>{status.closureNotice}</MessageBarBody>
              </MessageBar>
            )}

            <div className={styles.factStrip}>
              <div className={styles.metaRow}>
                <Building24Regular fontSize={16} />
                <Caption1>
                  Building {cafeteria.building}, Floor {cafeteria.floor}
                </Caption1>
              </div>
              {cafeteria.capacity && (
                <>
                  <Divider vertical className={styles.factDivider} />
                  <div className={styles.metaRow}>
                    <PeopleTeam24Regular fontSize={16} />
                    <Caption1>Seats {cafeteria.capacity}</Caption1>
                  </div>
                </>
              )}
              <Divider vertical className={styles.factDivider} />
              <div className={styles.metaRow}>
                <Mail24Regular fontSize={16} />
                <Caption1>{cafeteria.contactEmail}</Caption1>
              </div>
            </div>

            <div className={styles.sectionGrid}>
              <Stagger visible itemDelay={60}>
                <Slide appear inY='12px'>
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <IconChip hue='marigold' size={24}>
                        <CuisineIcon tag={cafeteria.cuisineTags[0]} size={14} />
                      </IconChip>
                      <Subtitle1>Cuisine</Subtitle1>
                    </div>
                    <div className={styles.cuisineRow}>
                      {cafeteria.cuisineTags.map((tag) => (
                        <Badge
                          key={tag}
                          appearance='outline'
                          icon={<CuisineIcon tag={tag} size={14} />}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Slide>

                <Slide appear inY='12px'>
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <IconChip hue='brand' size={24}>
                        <CalendarClock24Regular fontSize={14} />
                      </IconChip>
                      <Subtitle1>Hours</Subtitle1>
                    </div>
                    <div className={styles.hoursTable}>
                      {WEEKDAY_ORDER.map((weekday) => {
                        const hours = cafeteria.openingHours[weekday]
                        const isToday = weekday === todayWeekday
                        return (
                          <div
                            key={weekday}
                            className={
                              isToday
                                ? `${styles.hoursRow} ${styles.hoursRowToday}`
                                : styles.hoursRow
                            }
                          >
                            <Body1>{WEEKDAY_LABEL[weekday]}</Body1>
                            <Body1 className={styles.hoursTime}>
                              {hours ? `${hours[0]} – ${hours[1]}` : "Closed"}
                            </Body1>
                            {isToday && (
                              <Badge
                                appearance='filled'
                                color='brand'
                                size='small'
                              >
                                Today
                              </Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Slide>

                <Slide appear inY='12px'>
                  <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                      <IconChip hue='lightGreen' size={24}>
                        <Payment24Regular fontSize={14} />
                      </IconChip>
                      <Subtitle1>Payment methods</Subtitle1>
                    </div>
                    <div className={styles.paymentRow}>
                      {cafeteria.paymentMethods.map((method) => (
                        <Badge key={method} appearance='tint'>
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Slide>
              </Stagger>
            </div>
          </div>
        </Fade>
      )}
    </div>
  )
}
