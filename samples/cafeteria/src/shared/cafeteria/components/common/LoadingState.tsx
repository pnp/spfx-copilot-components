import * as React from "react"
import { Skeleton, SkeletonItem, makeStyles, tokens } from "@fluentui/react-components"

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
  },
  row: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
  },
})

export interface ILoadingStateProps {
  rows?: number
}

export default function LoadingState(props: ILoadingStateProps): React.ReactElement {
  const styles = useStyles()
  const rows = props.rows ?? 3

  return (
    <Skeleton className={styles.root} aria-label="Loading">
      {Array.from({ length: rows }).map((_, index) => (
        <div className={styles.row} key={index}>
          <SkeletonItem shape="rectangle" style={{ width: "48px", height: "48px" }} />
          <SkeletonItem style={{ flexGrow: 1 }} />
        </div>
      ))}
    </Skeleton>
  )
}
