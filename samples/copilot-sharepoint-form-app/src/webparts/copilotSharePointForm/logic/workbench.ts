export interface IHostSignals {
  href: string;
  webAbsoluteUrl: string;
  /** True for SPFx EnvironmentType.Local and EnvironmentType.Test. */
  localEnvironment: boolean;
}

export function isLocalWorkbench(host: IHostSignals): boolean {
  if (host.localEnvironment) {
    return true;
  }
  const href = (host.href || "").toLowerCase();
  const web = (host.webAbsoluteUrl || "").toLowerCase();
  if (!web) {
    return true;
  }
  if (href.indexOf("localhost") >= 0 || href.indexOf("127.0.0.1") >= 0) {
    return true;
  }
  if (web.indexOf("localhost") >= 0 || web.indexOf("127.0.0.1") >= 0) {
    return true;
  }
  return href.indexOf("workbench.aspx") >= 0 && web.indexOf("sharepoint.com") < 0;
}
