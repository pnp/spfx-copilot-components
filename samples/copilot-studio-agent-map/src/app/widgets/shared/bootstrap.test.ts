import type { App, CallToolResult } from "../../host/bridge";
import { createHostBootstrap } from "./bootstrap";

function appWith(callServerTool: App["callServerTool"]): App {
  return {
    callServerTool,
    requestDisplayMode: async ({ mode }) => ({ mode }),
    sendSizeChanged: async () => undefined,
    getHostCapabilities: () => undefined,
    getHostContext: () => undefined,
    downloadFile: async () => ({ isError: true }),
    openLink: async () => ({}),
  };
}

function bootstrapWith(callServerTool: App["callServerTool"]): ReturnType<typeof createHostBootstrap> {
  return createHostBootstrap({ app: appWith(callServerTool), view: "agent-map", openTool: "show_agent_map" });
}

describe("createHostBootstrap", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is not open until the open tool returns", async () => {
    let finish: (result: CallToolResult) => void = () => undefined;
    const pending = new Promise<CallToolResult>((resolve) => {
      finish = resolve;
    });
    const callServerTool = jest.fn(() => pending);
    const bootstrap = bootstrapWith(callServerTool);
    const listener = jest.fn();
    bootstrap.subscribe(listener);

    expect(bootstrap.getSnapshot()).toMatchObject({ data: null, opened: false });
    const started = bootstrap.start({ agentName: "Zava" });
    expect(bootstrap.getSnapshot()).toMatchObject({ data: null, opened: false, toolInput: { agentName: "Zava" } });
    expect(callServerTool).toHaveBeenCalledWith({ name: "show_agent_map", arguments: { agentName: "Zava" } });

    listener.mockClear();
    finish({ content: [], structuredContent: { state: "map" } });
    await started;

    expect(bootstrap.getSnapshot()).toMatchObject({ data: { state: "map" }, opened: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("is open with an error when the open tool fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    const bootstrap = bootstrapWith(async () => {
      throw new Error("Environment discovery failed.");
    });

    await bootstrap.start({});

    expect(bootstrap.getSnapshot()).toMatchObject({
      opened: true,
      data: { state: "error", error: { code: "OPEN_FAILED", message: "Environment discovery failed." } },
    });
  });

  it("is open when the result has no structured content", async () => {
    const bootstrap = bootstrapWith(async () => ({ content: [] }));

    await bootstrap.start({});

    expect(bootstrap.getSnapshot()).toMatchObject({ data: null, opened: true });
  });

  it("calls the open tool one time", async () => {
    const callServerTool = jest.fn(async (): Promise<CallToolResult> => ({ content: [], structuredContent: { state: "map" } }));
    const bootstrap = bootstrapWith(callServerTool);

    await bootstrap.start({});
    await bootstrap.start({});

    expect(callServerTool).toHaveBeenCalledTimes(1);
  });
});
