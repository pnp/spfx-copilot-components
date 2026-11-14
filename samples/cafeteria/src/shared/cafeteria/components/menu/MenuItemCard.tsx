import * as React from "react"
import {
  Card,
  CardHeader,
  CardFooter,
  Subtitle1,
  Caption1,
  Badge,
  makeStyles,
  tokens,
} from "@fluentui/react-components"

import type { IMenuItem } from "../../models"
import DietaryBadge from "./DietaryBadge"

const useStyles = makeStyles({
  card: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    borderRadius: tokens.borderRadiusXLarge,
    transitionProperty: "box-shadow, transform",
    transitionDuration: tokens.durationNormal,
    ":hover": {
      boxShadow: tokens.shadow4,
      transform: "translateY(-2px)",
    },
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
    width: "100%",
  },
  titleRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    minWidth: 0,
  },
  priceCell: {
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  tags: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
    flexWrap: "wrap",
    marginTop: "auto",
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  thumbnail: {
    height: "48px",
    width: "48px",
    borderRadius: tokens.borderRadiusMedium,
    objectFit: "cover",
  },
})

export interface IMenuItemCardProps {
  item: IMenuItem
}

export default function MenuItemCard(props: IMenuItemCardProps): React.ReactElement {
  const styles = useStyles()
  const { item } = props

  return (
    <Card className={styles.card} style={item.isSoldOut ? { opacity: 0.55 } : undefined}>
      <CardHeader
        image={
          item.imageUrl && <img className={styles.thumbnail} src={item.imageUrl} alt="" />
        }
        header={
          <div className={styles.headerRow}>
            <div className={styles.titleRow}>
              <Subtitle1>{item.title}</Subtitle1>
            </div>
            {item.isSoldOut ? (
              <Badge className={styles.priceCell} color="danger" appearance="tint">
                Sold out
              </Badge>
            ) : (
              <Badge className={styles.priceCell} color="brand" appearance="tint">
                ₹{item.price}
              </Badge>
            )}
          </div>
        }
        description={item.description && <Caption1>{item.description}</Caption1>}
      />
      <CardFooter className={styles.tags}>
        {item.dietaryTags.map((tag) => (
          <DietaryBadge key={tag} tag={tag} />
        ))}
      </CardFooter>
    </Card>
  )
}
