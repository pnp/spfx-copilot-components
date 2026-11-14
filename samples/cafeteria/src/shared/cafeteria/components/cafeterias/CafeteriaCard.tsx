import * as React from "react"
import {
  Card,
  CardHeader,
  CardFooter,
  Subtitle1,
  Caption1,
  Body1,
  makeStyles,
  tokens,
} from "@fluentui/react-components"
import { Building24Regular, PeopleTeam24Regular } from "@fluentui/react-icons"

import type { ICafeteria, CuisineTag } from "../../models"
import { getOpenStatus } from "../../services"
import CuisineIcon from "../common/CuisineIcon"
import IconChip, { type IconChipHue } from "../common/IconChip"
import OpenStatusBadge from "./OpenStatusBadge"

const CUISINE_HUE: Record<CuisineTag, IconChipHue> = {
  Indian: "marigold",
  Continental: "brand",
  Asian: "berry",
  Grill: "red",
}

const useStyles = makeStyles({
  card: {
    position: "relative",
    cursor: "pointer",
    height: "100%",
    borderRadius: tokens.borderRadiusXLarge,
    borderLeft: `4px solid ${tokens.colorNeutralStroke2}`,
    backgroundImage: `linear-gradient(135deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    overflow: "hidden",
    transitionProperty: "box-shadow, transform, border-color",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    // Soft radial glow that sits behind the content and fades in on hover.
    "::before": {
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      width: "55%",
      height: "55%",
      background: `radial-gradient(circle at top right, ${tokens.colorBrandBackground2} 0%, transparent 72%)`,
      opacity: 0,
      transitionProperty: "opacity",
      transitionDuration: tokens.durationNormal,
      transitionTimingFunction: tokens.curveEasyEase,
      pointerEvents: "none",
    },
    ":hover": {
      boxShadow: `${tokens.shadow8}, 0 0 16px -10px ${tokens.colorBrandStroke2}`,
      transform: "translateY(-2px)",
      borderLeftColor: tokens.colorBrandStroke1,
    },
    ":hover::before": {
      opacity: 0.5,
    },
    // Keep card content painted above the decorative glow layer.
    "> *": {
      position: "relative",
      zIndex: 1,
    },
  },
  cardOpen: {
    borderLeftColor: tokens.colorPaletteGreenBorderActive,
    "::before": {
      background: `radial-gradient(circle at top right, ${tokens.colorPaletteGreenBackground2} 0%, transparent 72%)`,
    },
    ":hover": {
      boxShadow: `${tokens.shadow8}, 0 0 16px -10px ${tokens.colorPaletteGreenBorderActive}`,
      borderLeftColor: tokens.colorPaletteGreenBorderActive,
    },
  },
  title: {
    marginBottom: tokens.spacingVerticalXS,
  },
  meta: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  cuisineRow: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
})

export interface ICafeteriaCardProps {
  cafeteria: ICafeteria
  onSelect: (cafeteriaId: string) => void
}

export default function CafeteriaCard(props: ICafeteriaCardProps): React.ReactElement {
  const styles = useStyles()
  const { cafeteria } = props
  const isOpen = getOpenStatus(cafeteria).isOpen

  return (
    <Card
      className={isOpen ? `${styles.card} ${styles.cardOpen}` : styles.card}
      onClick={() => props.onSelect(cafeteria.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          props.onSelect(cafeteria.id)
        }
      }}
    >
      <CardHeader
        header={
          <Subtitle1 block className={styles.title}>
            {cafeteria.title}
          </Subtitle1>
        }
        description={<OpenStatusBadge cafeteria={cafeteria} />}
      />
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <Building24Regular fontSize={16} />
          <Caption1>
            Building {cafeteria.building}, Floor {cafeteria.floor}
          </Caption1>
        </div>
        {cafeteria.capacity && (
          <div className={styles.metaRow}>
            <PeopleTeam24Regular fontSize={16} />
            <Caption1>Seats {cafeteria.capacity}</Caption1>
          </div>
        )}
      </div>
      <CardFooter>
        <div className={styles.cuisineRow}>
          {cafeteria.cuisineTags.map((tag) => (
            <IconChip key={tag} hue={CUISINE_HUE[tag]} size={24}>
              <CuisineIcon tag={tag} size={14} />
            </IconChip>
          ))}
        </div>
        <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
          {cafeteria.cuisineTags.join(" · ")}
        </Body1>
      </CardFooter>
    </Card>
  )
}
