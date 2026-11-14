import * as React from "react";
import { act } from "react-dom/test-utils";
import { createRoot, type Root } from "react-dom/client";
import { webLightTheme } from "@fluentui/react-components";
import { BYTES_PER_MB } from "../models";
import type { IEditableField, IFieldValueMap, ISubmissionResult, IUploadProgress } from "../models";
import { demoFields } from "../logic/demoLibrary";
import { CopilotSharePointForm } from "./CopilotSharePointForm";
import type { ICopilotSharePointFormProps, IFormSubmitRequest } from "./ICopilotSharePointFormProps";
import ui from "./ui/ui.module.scss";

class ResizeObserverStub {
  public observe(): void {
    return undefined;
  }

  public unobserve(): void {
    return undefined;
  }

  public disconnect(): void {
    return undefined;
  }
}

interface IMediaQueryListStub {
  matches: boolean;
  media: string;
  addListener(): void;
  removeListener(): void;
  addEventListener(): void;
  removeEventListener(): void;
  dispatchEvent(): boolean;
}

function props(overrides: Partial<ICopilotSharePointFormProps> = {}): ICopilotSharePointFormProps {
  return {
    instanceId: "form-test",
    theme: webLightTheme,
    libraryTitle: "Documents",
    maxFileSizeMb: 50,
    allowedExtensions: [".pdf", ".docx", ".xlsx", ".pptx", ".md", ".png", ".jpg"],
    loadingFields: false,
    demoMode: true,
    demoMessage: "Demo mode. Nothing is written to SharePoint.",
    fields: demoFields(),
    onRetryFields: (): void => undefined,
    onSubmit: (): Promise<ISubmissionResult> => Promise.reject(new Error("Submit was not expected.")),
    ...overrides
  };
}

const roots: WeakMap<HTMLDivElement, Root> = new WeakMap();

function renderForm(element: React.ReactElement): HTMLDivElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.set(host, root);
  act(() => {
    root.render(element);
  });
  return host;
}

function unmountForm(host: HTMLDivElement): void {
  const root = roots.get(host);
  act(() => {
    if (root) {
      root.unmount();
    }
  });
  roots.delete(host);
  host.remove();
}

function fileOf(name: string, size: number): File {
  const file = new File(["x"], name, { type: "application/octet-stream" });
  Object.defineProperty(file, "size", { configurable: true, value: size });
  return file;
}

function chooseFile(host: HTMLElement, file: File): void {
  const input = host.querySelector("input[type='file']") as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function setControl(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string): void {
  const prototype = Object.getPrototypeOf(element) as { value?: unknown };
  const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  }
  act(() => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function control(host: HTMLElement, name: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  const element = host.querySelector(`[data-field='${name}']`);
  if (!element) {
    throw new Error(`Missing field ${name}`);
  }
  return element as HTMLInputElement;
}

function clickButton(host: HTMLElement, label: string): void {
  const buttons = host.querySelectorAll("button");
  for (let index = 0; index < buttons.length; index += 1) {
    const button = buttons[index];
    const labelText = button.textContent || "";
    if (labelText.indexOf(label) >= 0) {
      act(() => {
        button.click();
      });
      return;
    }
  }
  throw new Error(`Missing button ${label}`);
}

describe("CopilotSharePointForm", () => {
  beforeAll(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    (window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver = ResizeObserverStub;
    if (!window.matchMedia) {
      window.matchMedia = (query: string): MediaQueryList => {
        const stub: IMediaQueryListStub = {
          matches: false,
          media: query,
          addListener: (): void => undefined,
          removeListener: (): void => undefined,
          addEventListener: (): void => undefined,
          removeEventListener: (): void => undefined,
          dispatchEvent: (): boolean => false
        };
        return stub as unknown as MediaQueryList;
      };
    }
  });

  it("renders the file picker and the required and optional library columns", () => {
    const host = renderForm(React.createElement(CopilotSharePointForm, props()));
    try {
      expect(host.textContent).toContain("Drag a file here");
      expect(host.textContent).toContain("Browse files");
      expect(host.textContent).toContain("Up to 50 MB");
      expect(host.textContent).toContain(".pdf");
      expect(host.textContent).toContain("Required");
      expect(host.textContent).toContain("Document Title");
      expect(host.textContent).toContain("Description");
      expect(host.textContent).toContain("Department");
      expect(host.textContent).toContain("Required");
      expect(host.textContent).toContain("Sample library");
      expect(host.querySelector("[data-single-screen='true']")).not.toBeNull();
      expect(host.querySelector("[data-react-bits='fade-slide']")).not.toBeNull();
      expect(host.querySelector("[data-slot='input']")).not.toBeNull();
      expect(host.querySelector("[data-slot='textarea']")).not.toBeNull();
      expect(host.querySelector("[data-slot='select']")).not.toBeNull();
      expect(host.querySelector("input[aria-required='true']")).not.toBeNull();
      expect(host.querySelector("input[type='file']")).not.toBeNull();
      expect(host.textContent).toContain("not attached to the Copilot chat");
      expect(host.textContent).toContain("Demo mode");
      const submit = host.querySelector("button[data-submit='document']");
      expect(submit).not.toBeNull();
      expect(submit && submit.className.indexOf(ui.submit) >= 0).toBe(true);
      expect(submit && submit.textContent ? submit.textContent : "").toContain("Submit document");
      expect(host.querySelector("[data-destination='target']")).not.toBeNull();
      expect(host.textContent).toContain("Site URL");
      expect(host.textContent).toContain("Load library");
    } finally {
      unmountForm(host);
    }
  });

  it("reloads the library from the site and library fields", () => {
    const calls: Array<{ siteUrl: string; libraryName: string }> = [];
    const host = renderForm(React.createElement(CopilotSharePointForm, props({
      siteUrl: "https://contoso.sharepoint.com/Files",
      libraryName: "Files",
      onLoadTarget: (siteUrl, libraryName): void => {
        calls.push({ siteUrl, libraryName });
      }
    })));
    try {
      setControl(control(host, "siteUrl"), "https://contoso.sharepoint.com/sites/hr");
      setControl(control(host, "libraryName"), "Documents");
      clickButton(host, "Load library");
      expect(calls).toEqual([{
        siteUrl: "https://contoso.sharepoint.com/sites/hr",
        libraryName: "Documents"
      }]);
    } finally {
      unmountForm(host);
    }
  });

  it("renders Title, Description, and Choice together and skips Person columns", () => {
    const fields: IEditableField[] = [
      { internalName: "Title", title: "Document Title", description: "", type: "Text", required: true, choices: [] },
      { internalName: "Description", title: "Description", description: "", type: "Note", required: true, choices: [] },
      { internalName: "Department", title: "Department", description: "", type: "Choice", required: false, choices: ["Legal"] },
      { internalName: "Owner", title: "Owner", description: "", type: "User", required: true, choices: [] }
    ];
    const host = renderForm(React.createElement(CopilotSharePointForm, props({
      fields,
      demoMode: false,
      libraryStatus: "verified"
    })));
    try {
      expect(host.querySelector("[data-slot='input']")).not.toBeNull();
      expect(host.querySelector("[data-slot='textarea']")).not.toBeNull();
      expect(host.querySelector("[data-slot='select']")).not.toBeNull();
      expect(host.querySelector("[data-field='Owner']")).toBeNull();
      expect(host.textContent).toContain("Verified library");
      expect(host.textContent).not.toContain("Owner");
    } finally {
      unmountForm(host);
    }
  });

  it("shows inline errors for an empty file, a file over 50 MB, and a blocked extension", () => {
    const host = renderForm(React.createElement(CopilotSharePointForm, props()));
    try {
      chooseFile(host, fileOf("empty.pdf", 0));
      expect(host.textContent).toContain("0 bytes");

      chooseFile(host, fileOf("huge.pdf", 50 * BYTES_PER_MB + 1));
      expect(host.textContent).toContain("over the 50 MB limit");

      chooseFile(host, fileOf("script.exe", 128));
      expect(host.textContent).toContain("not allowed");
      expect(host.textContent).toContain(".exe");
    } finally {
      unmountForm(host);
    }
  });

  it("blocks submit until required columns are filled", () => {
    const calls: IFormSubmitRequest[] = [];
    const host = renderForm(React.createElement(CopilotSharePointForm, props({
      onSubmit: (request): Promise<ISubmissionResult> => {
        calls.push(request);
        return Promise.reject(new Error("Should not submit."));
      }
    })));
    try {
      chooseFile(host, fileOf("policy.pdf", 4096));
      clickButton(host, "Submit document");
      expect(calls).toHaveLength(0);
      expect(host.textContent).toContain("Document Title is required.");
      expect(host.textContent).toContain("Department is required.");
      expect(host.querySelector("[role='alert']")).not.toBeNull();
      expect(host.querySelector("[aria-invalid='true']")).not.toBeNull();

      setControl(control(host, "Title"), "FY26 Policy");
      clickButton(host, "Submit document");
      expect(host.textContent).not.toContain("Document Title is required.");
      expect(host.textContent).toContain("Department is required.");
      expect(calls).toHaveLength(0);
    } finally {
      unmountForm(host);
    }
  });

  it("shows chunk progress and then the confirmation card", async () => {
    let resolveSubmit: (result: ISubmissionResult) => void = (): void => undefined;
    const pending = new Promise<ISubmissionResult>((resolve) => {
      resolveSubmit = resolve;
    });
    let lastProgress = 0;
    const host = renderForm(React.createElement(CopilotSharePointForm, props({
      demoMode: false,
      onSubmit: (request): Promise<ISubmissionResult> => {
        const update: IUploadProgress = {
          loadedBytes: 20 * BYTES_PER_MB,
          totalBytes: 50 * BYTES_PER_MB,
          percent: 40,
          mode: "chunked",
          stage: "continue",
          chunkIndex: 1,
          chunkCount: 5
        };
        lastProgress = update.percent;
        request.onProgress(update);
        return pending;
      }
    })));
    try {
      chooseFile(host, fileOf("policy.pdf", 50 * BYTES_PER_MB));
      setControl(control(host, "Title"), "FY26 Policy");
      setControl(control(host, "Department") as HTMLSelectElement, "Legal");
      setControl(control(host, "Description"), "Reviewed by counsel");
      clickButton(host, "Submit document");

      expect(lastProgress).toBe(40);
      expect(host.textContent).toContain("Uploading policy.pdf");
      expect(host.textContent).toContain("40%");
      expect(host.textContent).toContain("Chunked upload, chunk 2 of 5");

      const result: ISubmissionResult = {
        fileName: "policy.pdf",
        sizeBytes: 50 * BYTES_PER_MB,
        libraryTitle: "Documents",
        fileUrl: "https://contoso.sharepoint.com/sites/hr/Shared%20Documents/policy.pdf",
        demo: false,
        metadata: [
          { internalName: "Title", title: "Document Title", value: "FY26 Policy" },
          { internalName: "Department", title: "Department", value: "Legal" },
          { internalName: "Notes", title: "Notes", value: "Reviewed by counsel" }
        ]
      };
      await act(async () => {
        resolveSubmit(result);
        await pending;
      });

      expect(host.textContent).toContain("Document submitted");
      expect(host.textContent).toContain("policy.pdf");
      expect(host.textContent).toContain("50 MB");
      expect(host.textContent).toContain("Open file");
      expect(host.textContent).toContain("Saved metadata");
      expect(host.textContent).toContain("FY26 Policy");
      expect(host.textContent).toContain("Reviewed by counsel");
      const link = host.querySelector("a");
      expect(link && link.getAttribute("href")).toBe("https://contoso.sharepoint.com/sites/hr/Shared%20Documents/policy.pdf");
    } finally {
      unmountForm(host);
    }
  });

  it("shows a completed submission from the preview result", () => {
    const values: IFieldValueMap = { Title: "FY26 Travel Policy" };
    const initialResult: ISubmissionResult = {
      fileName: "FY26-travel-policy.pdf",
      sizeBytes: 18 * BYTES_PER_MB,
      libraryTitle: "Policies",
      fileUrl: "https://contoso.sharepoint.com/sites/hr/Policies/FY26-travel-policy.pdf",
      demo: false,
      metadata: [
        { internalName: "Title", title: "Document Title", value: values.Title as string },
        { internalName: "Confidential", title: "Confidential", value: "Yes" }
      ]
    };
    const host = renderForm(React.createElement(CopilotSharePointForm, props({
      libraryTitle: "Policies",
      demoMode: false,
      initialResult
    })));
    try {
      expect(host.textContent).toContain("Document submitted");
      expect(host.textContent).toContain("FY26-travel-policy.pdf");
      expect(host.textContent).toContain("18 MB");
      expect(host.textContent).toContain("Policies");
      expect(host.textContent).toContain("Confidential");
      expect(host.textContent).toContain("Yes");
    } finally {
      unmountForm(host);
    }
  });
});
