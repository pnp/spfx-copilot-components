import { matchByIdOrName, nameKey, type NamedItem } from "./nameMatch";

const environments: NamedItem[] = [
  { id: "env-dev", name: "Copilot Studio Kit - Dev" },
  { id: "env-test", name: "Copilot Studio Kit - Test" },
];

const agents: NamedItem[] = [
  { id: "zava", name: "ZAVA Visual Merchandizer" },
  { id: "sales-bot", name: "Contoso Sales Bot" },
  { id: "sale-bots", name: "Contoso Sale Bots" },
  { id: "helper-1", name: "Helper Dev 1" },
  { id: "helper-2", name: "Helper Dev 2" },
  { id: "dev", name: "Dev" },
];

function matchedId(items: NamedItem[], id?: string, name?: string): string {
  const match = matchByIdOrName(items, id, name);
  if (match.ambiguous) return "ambiguous";
  return match.item?.id ?? "none";
}

describe("nameKey", () => {
  it("keeps only letters, marks, and numbers in lower case", () => {
    expect(nameKey("Copilot Studio Kit – Dev.")).toBe("copilotstudiokitdev");
    expect(nameKey("ﾃｽﾄ Ｄｅｖ")).toBe("テストdev");
  });
});

describe("matchByIdOrName", () => {
  it("matches the ID without case", () => {
    expect(matchedId(environments, "ENV-TEST")).toBe("env-test");
  });

  it("uses the name when the ID does not match", () => {
    expect(matchedId(environments, "unknown", "Copilot Studio Kit - Test")).toBe("env-test");
  });

  it.each([
    "Copilot Studio Kit - dev",
    "Copilot Studio Kit - dev.",
    "copilot studio kit – dev",
    "Copilot Studio Kit — Dev",
    "“Copilot Studio Kit - Dev”",
    "Copilot Studio Kit-Dev",
    "  COPILOT STUDIO KIT DEV  ",
  ])("ignores case, spaces, and punctuation in %p", (name) => {
    expect(matchedId(environments, undefined, name)).toBe("env-dev");
  });

  it("accepts a small spelling difference in a long name", () => {
    expect(matchedId(agents, undefined, "Zava visual merchandiser")).toBe("zava");
    expect(matchedId(agents, undefined, "Zava visual merchandsier")).toBe("zava");
  });

  it("is ambiguous when more than one name is near", () => {
    expect(matchedId(agents, undefined, "Contoso Sales Bots")).toBe("ambiguous");
  });

  it("is ambiguous when more than one item has the same name", () => {
    const duplicates: NamedItem[] = [{ id: "a", name: "Bot" }, { id: "b", name: "bot" }];
    expect(matchedId(duplicates, undefined, "BOT")).toBe("ambiguous");
  });

  it("does not match names with different numbers", () => {
    expect(matchedId(agents, undefined, "Helper Dev 1")).toBe("helper-1");
    expect(matchedId(agents, undefined, "Helper Dev 3")).toBe("none");
  });

  it("does not accept a spelling difference in a short name", () => {
    expect(matchedId(agents, undefined, "Dav")).toBe("none");
  });

  it("matches the default environment without the \"(default)\" suffix", () => {
    const tenant: NamedItem[] = [
      { id: "default", name: "Contoso (default)" },
      { id: "dev", name: "Contoso Dev" },
    ];
    expect(matchedId(tenant, undefined, "Contoso")).toBe("default");
    expect(matchedId(tenant, undefined, "contoso (Default)")).toBe("default");
    expect(matchedId([...tenant, { id: "contoso", name: "Contoso" }], undefined, "Contoso")).toBe("contoso");
  });

  it("does not match a different name or an empty name", () => {
    expect(matchedId(environments, undefined, "Copilot Studio Kit")).toBe("none");
    expect(matchedId(agents, undefined, "Fabrikam Helpdesk")).toBe("none");
    expect(matchedId(agents, undefined, " ")).toBe("none");
    expect(matchedId(agents)).toBe("none");
  });
});
