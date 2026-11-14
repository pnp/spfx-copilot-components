import * as React from "react"
import { Card, CardHeader, CardFooter, SkeletonItem, makeStyles, tokens } from "@fluentui/react-components"

const useStyles = makeStyles({
  card: {
    height: "100%",
    borderRadius: tokens.borderRadiusXLarge,
  },
  thumbnail: {
    height: "48px",
    width: "48px",
    borderRadius: tokens.borderRadiusMedium,
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  footer: {
    display: "flex",
    gap: tokens.spacingHorizontalXS,
  },
  pill: {
    height: "20px",
    width: "56px",
    borderRadius: tokens.borderRadiusMedium,
  },
})

export interface ICardSkeletonProps {
  showImage?: boolean
  footerItems?: number
}

export default function CardSkeleton(props: ICardSkeletonProps): React.ReactElement {
  const styles = useStyles()
  const footerItems = props.footerItems ?? 2

  return (
    <Card className={styles.card}>
      <CardHeader
        image={props.showImage ? <SkeletonItem shape="rectangle" className={styles.thumbnail} /> : undefined}
        header={
          <div className={styles.headerText}>
            <SkeletonItem style={{ width: "70%" }} />
          </div>
        }
        description={<SkeletonItem style={{ width: "40%" }} />}
      />
      {footerItems > 0 && (
        <CardFooter className={styles.footer}>
          {Array.from({ length: footerItems }).map((_, index) => (
            <SkeletonItem key={index} shape="rectangle" className={styles.pill} />
          ))}
        </CardFooter>
      )}
    </Card>
  )
}
