import type {
  AgentMapEdge,
  AgentMapNode,
  AgentMapNodeCategory,
} from "../../agent-map/types";
import { toAgentMapViewGraph, type AgentMapFilters } from "./agentMapViewModel";
import {
  createDefaultFilters,
  filterAgentMapGraph,
  HIDDEN_BY_DEFAULT_CATEGORIES,
  restoreSavedCategories,
  revealCategory,
} from "./filterAgentMapGraph";

function node(id: string, category: AgentMapNodeCategory): AgentMapNode {
  return { id, category, label: id, subtitle: category, details: {}, warnings: [] };
}

function containsEdge(target: string): AgentMapEdge {
  return {
    id: `agent-${target}`,
    source: "agent",
    target,
    relationship: "contains",
    provenance: "structural",
    evidence: "The component belongs to the agent.",
    confidence: 1,
  };
}

const nodes: AgentMapNode[] = [
  node("agent", "agent"),
  node("skill", "skill"),
  node("tool", "tool"),
  node("test-case", "test-case"),
  node("unknown", "unknown"),
];

const graph = toAgentMapViewGraph({
  agent: { id: "agent", name: "Agent", environmentId: "env", environmentName: "Environment" },
  nodes,
  edges: ["skill", "tool", "test-case", "unknown"].map(containsEdge),
  diagnostics: [],
  summary: {
    nodeCount: 5,
    componentCount: 4,
    edgeCount: 4,
    unresolvedCount: 1,
    skillReferenceCount: 0,
    linkedSkillCount: 0,
    unlinkedSkillCount: 1,
  },
});

function shownNodeIds(filters: AgentMapFilters): string[] {
  return filterAgentMapGraph(graph, filters).nodes.map((item) => item.id);
}

describe("createDefaultFilters", () => {
  it("hides evaluation sets, test cases, and unknown items", () => {
    const filters = createDefaultFilters();
    expect(HIDDEN_BY_DEFAULT_CATEGORIES).toEqual(new Set(["evaluation-set", "test-case", "unknown"]));
    expect(shownNodeIds(filters)).toEqual(["agent", "skill", "tool"]);
    expect(filterAgentMapGraph(graph, filters).edges.map((edge) => edge.target))
      .toEqual(["skill", "tool"]);
  });
});

describe("revealCategory", () => {
  it("shows unknown items when the maker turns on the Unknown category", () => {
    const filters = revealCategory(createDefaultFilters(), "unknown");
    expect(shownNodeIds(filters)).toEqual(["agent", "skill", "tool", "unknown"]);
    expect(shownNodeIds({ ...filters, includeUnresolved: false }))
      .toEqual(["agent", "skill", "tool"]);
  });

  it("does not change filters that already show the category", () => {
    const filters = createDefaultFilters();
    expect(revealCategory(filters, "tool")).toBe(filters);
  });
});

describe("filterAgentMapGraph search", () => {
  const searchGraph = toAgentMapViewGraph({
    agent: { id: "agent", name: "Store Agent", environmentId: "env", environmentName: "Environment" },
    nodes: [
      {
        ...node("agent", "agent"),
        label: "Store Agent",
        description: "Use the Photo Library to find product photos.",
        details: { Knowledge: 0 },
      },
      { ...node("photos", "tool"), label: "Photo Library" },
      { ...node("weather", "tool"), label: "Weather" },
      { ...node("planner", "skill"), label: "Display planner" },
    ],
    edges: [
      ...["photos", "weather", "planner"].map(containsEdge),
      {
        id: "planner-weather",
        source: "planner",
        target: "weather",
        relationship: "references tool",
        provenance: "textual-exact",
        evidence: "Check the forecast.",
        confidence: 1,
      },
    ],
    diagnostics: [],
    summary: {
      nodeCount: 4,
      componentCount: 3,
      edgeCount: 4,
      unresolvedCount: 0,
      skillReferenceCount: 1,
      linkedSkillCount: 1,
      unlinkedSkillCount: 0,
    },
  });

  function highlighted(query: string): { nodes: string[]; edges: string[] } {
    const result = filterAgentMapGraph(searchGraph, { ...createDefaultFilters(), query });
    return { nodes: [...result.matchedNodeIds].sort(), edges: [...result.matchedEdgeIds].sort() };
  }

  it("does not highlight every component when the agent instructions match", () => {
    expect(highlighted("photo")).toEqual({ nodes: ["agent", "photos"], edges: ["agent-photos"] });
  });

  it("highlights only the agent when only the agent matches", () => {
    expect(highlighted("knowledge")).toEqual({ nodes: ["agent"], edges: [] });
  });

  it("highlights the components next to a matching component", () => {
    expect(highlighted("display planner")).toEqual({
      nodes: ["agent", "planner", "weather"],
      edges: ["agent-planner", "planner-weather"],
    });
  });
});

describe("restoreSavedCategories", () => {
  it("changes an earlier default to the current default", () => {
    const earlierDefault: AgentMapNodeCategory[] = [
      "agent", "tool", "skill", "topic", "action", "knowledge", "connected-agent", "trigger", "unknown",
    ];
    expect(restoreSavedCategories(earlierDefault)).toEqual(createDefaultFilters().categories);
  });

  it("keeps a category set that the maker chose", () => {
    expect(restoreSavedCategories(["agent", "unknown"])).toEqual(new Set(["agent", "unknown"]));
  });
});
