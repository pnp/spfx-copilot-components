import { demoFields } from "../logic/demoLibrary";
import type { IHttpClient, IHttpResponse } from "./http";
import {
  SharePointFormSubmissionService,
  isSharePointHost,
  isUsableSiteUrl,
  resolveAllowedSharePointOrigin,
  type ISubmissionTarget
} from "./SharePointFormSubmissionService";
import type { IFormSubmitRequest } from "../components/ICopilotSharePointFormProps";

function jsonResponse(status: number, body: unknown): IHttpResponse {
  const text = JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: (): Promise<string> => Promise.resolve(text)
  };
}

class RecordingClient implements IHttpClient {
  public readonly urls: string[] = [];

  public constructor(private readonly _status: number) {
  }

  public get(url: string): Promise<IHttpResponse> {
    this.urls.push(url);
    if (url.indexOf("ListItemAllFields") >= 0) {
      return Promise.resolve(jsonResponse(200, { Id: 7, FileRef: "/sites/policies/Policies/policy.pdf" }));
    }
    if (url.indexOf("/fields?") >= 0) {
      return Promise.resolve(jsonResponse(this._status, {
        value: [
          { InternalName: "Title", Title: "Document Title", TypeAsString: "Text", Required: true },
          { InternalName: "FileLeafRef", Title: "Name", TypeAsString: "File", Required: true }
        ]
      }));
    }
    return Promise.resolve(jsonResponse(this._status, this._status === 200 ? {
      Id: "list",
      Title: "Policies",
      BaseTemplate: 101,
      RootFolder: { ServerRelativeUrl: "/sites/policies/Policies" }
    } : {
      error: { message: this._status === 403 ? "Access denied." : "List not found." }
    }));
  }

  public post(url: string): Promise<IHttpResponse> {
    this.urls.push(url);
    if (url.indexOf("ListItemAllFields") >= 0) {
      return Promise.resolve(jsonResponse(200, { Id: 7, FileRef: "/sites/policies/Policies/a.pdf" }));
    }
    if (url.indexOf("ValidateUpdateListItem") >= 0) {
      return Promise.resolve(jsonResponse(200, { value: [{ FieldName: "Title", HasException: false }] }));
    }
    return Promise.resolve(jsonResponse(200, {}));
  }
}

function target(overrides: Partial<ISubmissionTarget> = {}): ISubmissionTarget {
  return {
    siteUrl: "",
    libraryName: "",
    libraryTitle: "Policies",
    configuredColumns: "",
    maxFileSizeMb: "50",
    allowedExtensions: ".pdf",
    overwriteExisting: true,
    localEnvironment: false,
    pageHref: "https://m365.cloud.microsoft/chat",
    currentWebUrl: "",
    useCurrentWebWhenSiteUrlBlank: false,
    defaultLibraryTitleWhenBlank: true,
    ...overrides
  };
}

function submitRequest(): IFormSubmitRequest {
  return {
    file: new File(["hello"], "policy.pdf", { type: "application/pdf" }),
    values: {
      Title: "Policy",
      Department: "Legal",
      EffectiveDate: "2026-11-01",
      Confidential: false
    },
    onProgress: (): void => undefined,
    isCancelled: (): boolean => false
  };
}

describe("SharePointFormSubmissionService", () => {
  it("accepts only HTTPS SharePoint site URLs on the allowed tenant origin and rejects http, non-SharePoint, and cross-tenant URLs", () => {
    expect(isUsableSiteUrl("https://contoso.sharepoint.com/sites/policies")).toBe(true);
    expect(isUsableSiteUrl("https://contoso.sharepoint.us/sites/policies")).toBe(true);
    expect(isUsableSiteUrl("http://contoso.sharepoint.com/sites/policies")).toBe(false);
    expect(isUsableSiteUrl("https://evil.example.com/sites/policies")).toBe(false);
    expect(isUsableSiteUrl("https://sharepoint.com/sites/policies")).toBe(false);
    expect(isUsableSiteUrl("https://user:pass@contoso.sharepoint.com/sites/policies")).toBe(false);
    expect(isUsableSiteUrl("")).toBe(false);
    expect(isUsableSiteUrl("policies")).toBe(false);

    expect(isSharePointHost("contoso.sharepoint.com")).toBe(true);
    expect(isSharePointHost("sharepoint.com")).toBe(false);
    expect(isSharePointHost("evil.example.com")).toBe(false);

    expect(resolveAllowedSharePointOrigin("https://contoso.sharepoint.com/sites/hr")).toBe("https://contoso.sharepoint.com");
    expect(resolveAllowedSharePointOrigin("", "https://m365.cloud.microsoft/chat")).toBe("");

    expect(isUsableSiteUrl("https://contoso.sharepoint.com/sites/policies", "https://contoso.sharepoint.com/sites/hr")).toBe(true);
    expect(isUsableSiteUrl("https://other.sharepoint.com/sites/policies", "https://contoso.sharepoint.com/sites/hr")).toBe(false);
  });

  it("never calls SPHttpClient for external, HTTP, or cross-tenant site URLs", async () => {
    const client = new RecordingClient(200);

    const external = new SharePointFormSubmissionService(client, target({
      siteUrl: "https://evil.example.com/sites/policies"
    }));
    const externalSession = await external.load();
    expect(externalSession.demoMode).toBe(true);
    expect(externalSession.webAbsoluteUrl).toBe("");
    expect(client.urls).toHaveLength(0);

    const insecure = new SharePointFormSubmissionService(client, target({
      siteUrl: "http://contoso.sharepoint.com/sites/policies"
    }));
    const insecureSession = await insecure.load();
    expect(insecureSession.demoMode).toBe(true);
    expect(insecureSession.webAbsoluteUrl).toBe("");
    expect(client.urls).toHaveLength(0);

    const crossTenant = new SharePointFormSubmissionService(client, target({
      siteUrl: "https://other.sharepoint.com/sites/policies",
      currentWebUrl: "https://contoso.sharepoint.com/sites/hr"
    }));
    const crossTenantSession = await crossTenant.load();
    expect(crossTenantSession.demoMode).toBe(true);
    expect(crossTenantSession.demoMessage).toContain("must match the current SharePoint tenant");
    expect(crossTenantSession.webAbsoluteUrl).toBe("");
    expect(client.urls).toHaveLength(0);
  });

  it("uses sample columns when Copilot has no usable site URL", async () => {
    const client = new RecordingClient(200);
    const service = new SharePointFormSubmissionService(client, target());
    const session = await service.load();
    expect(session.demoMode).toBe(true);
    expect(session.demoMessage).toContain("No SharePoint site URL");
    expect(session.fields.map((field) => field.title)).toEqual(demoFields().map((field) => field.title));
    expect(client.urls).toEqual([]);

    const invalid = new SharePointFormSubmissionService(client, target({ siteUrl: "the policies site" }));
    const invalidSession = await invalid.load();
    expect(invalidSession.demoMode).toBe(true);
    expect(invalidSession.demoMessage).toContain("isn't a SharePoint address");

    const result = await service.submit(submitRequest());
    expect(result.demo).toBe(true);
    expect(result.fileName).toBe("policy.pdf");
    expect(client.urls).toEqual([]);
  });

  it("loads the live library and submits when the site URL is usable", async () => {
    const client = new RecordingClient(200);
    const service = new SharePointFormSubmissionService(client, target({
      siteUrl: "https://contoso.sharepoint.com/sites/policies"
    }));
    const session = await service.load();
    expect(session.demoMode).toBe(false);
    expect(session.libraryStatus).toBe("verified");
    expect(session.uploadBlocked).toBe(false);
    expect(session.libraryTitle).toBe("Policies");
    expect(session.fields.map((field) => field.internalName)).toEqual(["Title"]);
    expect(client.urls[0]).toContain("getByTitle('Policies')");
    expect(client.urls[1]).toContain("Hidden eq false and ReadOnlyField eq false");

    const result = await service.submit(submitRequest());
    expect(result.demo).toBe(false);
    expect(result.fileName).toBe("policy.pdf");
    expect(client.urls.some((url) => url.indexOf("/Files/add(") >= 0)).toBe(true);
    expect(client.urls.some((url) => url.indexOf("ValidateUpdateListItem") >= 0)).toBe(true);
  });

  it("enforces the default extension allowlist during submit even when allowedExtensions is blank", async () => {
    const client = new RecordingClient(200);
    const service = new SharePointFormSubmissionService(client, target({
      siteUrl: "https://contoso.sharepoint.com/sites/policies",
      allowedExtensions: ""
    }));
    await service.load();
    const initialUrlCount = client.urls.length;
    await expect(service.submit({
      ...submitRequest(),
      file: new File(["<script>alert(1)</script>"], "attack.html", { type: "text/html" })
    })).rejects.toThrow("not allowed");
    expect(client.urls).toHaveLength(initialUrlCount);
  });

  it("falls back to demo mode when the library is missing and keeps a permission error visible", async () => {
    const missing = new RecordingClient(404);
    const missingService = new SharePointFormSubmissionService(missing, target({
      siteUrl: "https://contoso.sharepoint.com/sites/policies"
    }));
    const missingSession = await missingService.load();
    expect(missingSession.demoMode).toBe(false);
    expect(missingSession.libraryStatus).toBe("missing");
    expect(missingSession.uploadBlocked).toBe(true);
    expect(missingSession.fieldsError).toContain("was not found");
    await expect(missingService.submit(submitRequest())).rejects.toThrow("was not found");

    const denied = new RecordingClient(403);
    const deniedSession = await new SharePointFormSubmissionService(denied, target({
      siteUrl: "https://contoso.sharepoint.com/sites/policies"
    })).load();
    expect(deniedSession.demoMode).toBe(false);
    expect(deniedSession.fieldsError).toContain("Access denied");

    const untitled = await new SharePointFormSubmissionService(new RecordingClient(200), target({
      useCurrentWebWhenSiteUrlBlank: true,
      currentWebUrl: "https://contoso.sharepoint.com/sites/hr",
      defaultLibraryTitleWhenBlank: false,
      libraryTitle: ""
    })).load();
    expect(untitled.demoMode).toBe(false);
    expect(untitled.fieldsError).toContain("library name");
    expect(untitled.uploadBlocked).toBe(true);
  });

  it("blocks upload when the list is not a document library", async () => {
    const client = new RecordingClient(200);
    const original = client.get.bind(client);
    client.get = (url: string): Promise<IHttpResponse> => {
      if (url.indexOf("/fields?") < 0 && url.indexOf("ListItemAllFields") < 0) {
        client.urls.push(url);
        return Promise.resolve(jsonResponse(200, {
          Id: "list",
          Title: "Tasks",
          BaseTemplate: 100,
          RootFolder: { ServerRelativeUrl: "/sites/policies/Lists/Tasks" }
        }));
      }
      return original(url);
    };
    const session = await new SharePointFormSubmissionService(client, target({
      libraryName: "Tasks",
      siteUrl: "https://contoso.sharepoint.com/sites/policies"
    })).load();
    expect(session.libraryStatus).toBe("invalid");
    expect(session.uploadBlocked).toBe(true);
    expect(session.fieldsError).toContain("not a document library");
    expect(client.urls.some((url) => url.indexOf("/fields?") >= 0)).toBe(false);
  });

  it("uses the current site for the web part and demo mode in the local workbench", async () => {
    const client = new RecordingClient(200);
    const web = new SharePointFormSubmissionService(client, target({
      useCurrentWebWhenSiteUrlBlank: true,
      defaultLibraryTitleWhenBlank: false,
      currentWebUrl: "https://contoso.sharepoint.com/sites/hr",
      libraryTitle: "Documents",
      pageHref: "https://contoso.sharepoint.com/sites/hr/SitePages/Home.aspx"
    }));
    const live = await web.load();
    expect(live.demoMode).toBe(false);
    expect(live.webAbsoluteUrl).toBe("https://contoso.sharepoint.com/sites/hr");

    const local = await new SharePointFormSubmissionService(client, target({
      localEnvironment: true,
      siteUrl: "https://contoso.sharepoint.com/sites/policies"
    })).load();
    expect(local.demoMode).toBe(true);
    expect(local.demoMessage).toContain("local workbench");
  });

  it("strips a library path off the site URL and reloads when the destination changes", async () => {
    const client = new RecordingClient(200);
    const service = new SharePointFormSubmissionService(client, target({
      siteUrl: "https://contoso.sharepoint.com/Files",
      libraryName: "Files",
      libraryTitle: "Files"
    }));
    const session = await service.load();
    expect(session.webAbsoluteUrl).toBe("https://contoso.sharepoint.com");
    expect(client.urls[0]).toContain("getByTitle('Files')");

    service.setDestination("https://contoso.sharepoint.com/sites/hr/Documents", "Documents");
    const next = await service.load();
    expect(next.webAbsoluteUrl).toBe("https://contoso.sharepoint.com/sites/hr");
    expect(client.urls.some((url) => url.indexOf("getByTitle('Documents')") >= 0)).toBe(true);
  });
});
