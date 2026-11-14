import { makeStyles, tokens } from "@fluentui/react-components";

export const useFormStyles = makeStyles({
  root: {
    boxSizing: "border-box",
    width: "100%",
    maxWidth: "640px",
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM,
    paddingTop: "24px",
    paddingBottom: tokens.spacingVerticalM,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusMedium,
    overflow: "visible"
  },
  heading: {
    margin: 0,
    paddingTop: "4px",
    fontSize: tokens.fontSizeBase500,
    lineHeight: "32px",
    fontWeight: tokens.fontWeightSemibold,
    overflow: "visible"
  },
  sectionHeading: {
    margin: 0,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    fontWeight: tokens.fontWeightSemibold
  },
  copy: {
    margin: 0,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground2,
    maxWidth: "62ch"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalL
  },
  section: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalM
  },
  drop: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    rowGap: tokens.spacingVerticalS,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    textAlign: "center",
    backgroundColor: tokens.colorNeutralBackground3,
    borderTopWidth: tokens.strokeWidthThick,
    borderRightWidth: tokens.strokeWidthThick,
    borderBottomWidth: tokens.strokeWidthThick,
    borderLeftWidth: tokens.strokeWidthThick,
    borderTopStyle: "dashed",
    borderRightStyle: "dashed",
    borderBottomStyle: "dashed",
    borderLeftStyle: "dashed",
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusMedium
  },
  dropActive: {
    backgroundColor: tokens.colorBrandBackground2,
    borderTopColor: tokens.colorBrandStroke1,
    borderRightColor: tokens.colorBrandStroke1,
    borderBottomColor: tokens.colorBrandStroke1,
    borderLeftColor: tokens.colorBrandStroke1
  },
  dropTitle: {
    margin: 0,
    fontSize: tokens.fontSizeBase400,
    lineHeight: tokens.lineHeightBase400,
    fontWeight: tokens.fontWeightSemibold
  },
  fileInput: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    border: 0
  },
  selected: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXS,
    width: "100%"
  },
  fileName: {
    margin: 0,
    fontWeight: tokens.fontWeightSemibold,
    minWidth: 0,
    overflowWrap: "anywhere"
  },
  field: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS
  },
  label: {
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    fontWeight: tokens.fontWeightSemibold
  },
  control: {
    boxSizing: "border-box",
    width: "100%",
    minHeight: "32px",
    margin: 0,
    paddingTop: "5px",
    paddingBottom: "5px",
    paddingLeft: "8px",
    paddingRight: "8px",
    fontFamily: "inherit",
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    color: tokens.colorNeutralForeground1,
    backgroundColor: tokens.colorNeutralBackground1,
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    borderRadius: tokens.borderRadiusMedium
  },
  textArea: {
    minHeight: "72px",
    resize: "vertical"
  },
  choices: {
    display: "flex",
    flexDirection: "column",
    rowGap: tokens.spacingVerticalXS,
    margin: 0,
    padding: 0,
    border: 0
  },
  check: {
    display: "flex",
    alignItems: "center",
    columnGap: tokens.spacingHorizontalS
  },
  hint: {
    margin: 0,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorNeutralForeground2
  },
  error: {
    margin: 0,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    color: tokens.colorPaletteRedForeground1
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS
  },
  facts: {
    display: "grid",
    gridTemplateColumns: "minmax(8rem, 11rem) minmax(0, 1fr)",
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXS,
    margin: 0
  },
  term: {
    margin: 0,
    color: tokens.colorNeutralForeground2
  },
  detail: {
    margin: 0,
    overflowWrap: "anywhere"
  },
  link: {
    color: tokens.colorBrandForegroundLink
  },
  progressCopy: {
    margin: 0,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    border: 0
  }
});
