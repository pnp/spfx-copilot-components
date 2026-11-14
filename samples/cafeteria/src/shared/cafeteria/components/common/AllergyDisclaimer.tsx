import * as React from "react"
import { Caption1, makeStyles, tokens } from "@fluentui/react-components"
import { Info16Regular } from "@fluentui/react-icons"

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  icon: {
    flexShrink: 0,
    marginTop: "2px",
  },
})

export default function AllergyDisclaimer(): React.ReactElement {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Info16Regular className={styles.icon} />
      <Caption1>
        Dietary tags are provided by each cafeteria as a guide and are not a guarantee against
        cross-contamination. If you have a severe allergy, please confirm with cafeteria staff
        before ordering.
      </Caption1>
    </div>
  )
}
