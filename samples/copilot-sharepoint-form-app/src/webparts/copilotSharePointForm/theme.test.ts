import type { IReadonlyTheme } from "@microsoft/sp-component-base";
import { webLightTheme } from "@fluentui/react-components";
import { toFluentTheme } from "./theme";

describe("toFluentTheme", () => {
  it("keeps the brand fill when a shaded section sets themePrimary to white", () => {
    const theme = toFluentTheme({
      isInverted: false,
      palette: { themePrimary: "#ffffff" },
      semanticColors: {
        bodyBackground: "#e1dfdd",
        bodyText: "#323130",
        bodySubtext: "#605e5c"
      }
    } as unknown as IReadonlyTheme);

    expect(theme.colorBrandBackground).toBe(webLightTheme.colorBrandBackground);
    expect(theme.colorCompoundBrandBackground).toBe(webLightTheme.colorCompoundBrandBackground);
    expect(theme.colorBrandBackground).not.toBe("#ffffff");
    expect(theme.colorNeutralBackground1).toBe("#e1dfdd");
    expect(theme.colorNeutralForeground1).toBe("#323130");
  });
});
