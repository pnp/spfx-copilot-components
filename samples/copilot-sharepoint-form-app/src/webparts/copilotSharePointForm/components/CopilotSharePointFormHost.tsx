import * as React from "react";
import type { Theme } from "@fluentui/react-components";
import { normalizeMaxFileSizeMb, parseAllowedExtensions } from "../logic/fileValidation";
import type { ISubmissionResult } from "../models";
import type { IFormSession, SharePointFormSubmissionService } from "../services/SharePointFormSubmissionService";
import { CopilotSharePointForm } from "./CopilotSharePointForm";
import type { IFormSubmitRequest } from "./ICopilotSharePointFormProps";

export interface ICopilotSharePointFormHostProps {
  instanceId: string;
  theme: Theme;
  service: SharePointFormSubmissionService;
  displayMode?: "inline" | "fullscreen";
  onExpand?: () => Promise<void>;
  onSubmitted?: (result: ISubmissionResult) => Promise<void>;
  onMeasured?: (width: number, height: number) => void;
}

export function CopilotSharePointFormHost(props: ICopilotSharePointFormHostProps): React.ReactElement {
  const [session, setSession] = React.useState<IFormSession | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const generation = React.useRef(0);
  const service = props.service;

  const runLoad = React.useCallback((): void => {
    const current = generation.current + 1;
    generation.current = current;
    setLoading(true);
    service.load().then((next) => {
      if (generation.current !== current) {
        return;
      }
      setSession(next);
      setLoading(false);
    }).catch((error: unknown) => {
      if (generation.current !== current) {
        return;
      }
      setSession(failedSession(error instanceof Error && error.message ? error.message : "The document library could not be read."));
      setLoading(false);
    });
  }, [service]);

  React.useEffect(() => {
    runLoad();
  }, [runLoad]);

  const onMeasured = props.onMeasured;
  React.useEffect(() => {
    if (loading || !onMeasured || !rootRef.current) {
      return;
    }
    onMeasured(rootRef.current.clientWidth, rootRef.current.scrollHeight);
  }, [loading, session, onMeasured]);

  const onSubmit = (request: IFormSubmitRequest): Promise<ISubmissionResult> => {
    return props.service.submit(request).then((result) => {
      if (props.onSubmitted) {
        props.onSubmitted(result).catch((error: unknown) => {
          console.error("[CopilotSharePointForm] Couldn't post the follow-up.", error);
        });
      }
      return result;
    });
  };

  const onRetry = (): void => {
    runLoad();
  };

  const onLoadTarget = (siteUrl: string, libraryName: string): void => {
    props.service.setDestination(siteUrl, libraryName);
    runLoad();
  };

  return (
    <div ref={rootRef}>
      <CopilotSharePointForm
        instanceId={props.instanceId}
        theme={props.theme}
        libraryTitle={session ? session.libraryTitle : ""}
        maxFileSizeMb={normalizeMaxFileSizeMb(props.service.target.maxFileSizeMb)}
        allowedExtensions={parseAllowedExtensions(props.service.target.allowedExtensions)}
        loadingFields={loading}
        fieldsError={session ? session.fieldsError : undefined}
        demoMode={session ? session.demoMode : false}
        demoMessage={session ? session.demoMessage : undefined}
        libraryStatus={session ? session.libraryStatus : undefined}
        uploadBlocked={session ? session.uploadBlocked : false}
        fields={session ? session.fields : []}
        displayMode={props.displayMode}
        onExpand={props.onExpand}
        siteUrl={session ? session.webAbsoluteUrl : props.service.target.siteUrl}
        libraryName={session ? session.libraryTitle : (props.service.target.libraryName || props.service.target.libraryTitle)}
        onLoadTarget={onLoadTarget}
        onRetryFields={onRetry}
        onSubmit={onSubmit}
      />
    </div>
  );
}

function failedSession(message: string): IFormSession {
  return {
    libraryTitle: "",
    libraryStatus: "invalid",
    uploadBlocked: true,
    fields: [],
    folderServerRelativeUrl: "",
    demoMode: false,
    fieldsError: message,
    webAbsoluteUrl: ""
  };
}
