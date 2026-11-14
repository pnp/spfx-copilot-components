import * as React from "react";
import {
  Button,
  FluentProvider,
  IdPrefixProvider,
  MessageBar,
  MessageBarBody,
  ProgressBar,
  Spinner
} from "@fluentui/react-components";
import { ArrowExpand20Regular, ArrowUpload24Regular, CheckmarkCircle24Regular } from "@fluentui/react-icons";
import type { FieldValue, IFieldErrorMap, IFieldValueMap, ISubmissionResult, IUploadProgress } from "../models";
import { isSupportedColumnType } from "../logic/configuredColumns";
import { groupFields, emptyValues, hasFieldErrors, validateFormValues } from "../logic/fieldSchema";
import { acceptAttribute, effectiveAllowedExtensions, validateSelectedFile } from "../logic/fileValidation";
import { formatBytes } from "../logic/format";
import { FieldControl, LibraryStatusBadge } from "./FieldControl";
import { FadeSlideUp } from "./motion/FadeSlideUp";
import { useFormStyles } from "./formStyles";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import ui from "./ui/ui.module.scss";
import type { ICopilotSharePointFormProps, IFormSubmitRequest } from "./ICopilotSharePointFormProps";

type FormPhase = "form" | "uploading" | "done";

export function CopilotSharePointForm(props: ICopilotSharePointFormProps): React.ReactElement {
  const direction = typeof document !== "undefined" && document.documentElement && document.documentElement.dir === "rtl"
    ? "rtl"
    : "ltr";
  return (
    <IdPrefixProvider value={formPrefix(props.instanceId)}>
      <FluentProvider theme={props.theme} dir={direction} style={{ width: "100%" }}>
        <FormView {...props} />
      </FluentProvider>
    </IdPrefixProvider>
  );
}

function FormView(props: ICopilotSharePointFormProps): React.ReactElement {
  const styles = useFormStyles();
  const visibleFields = props.fields.filter((field) => isSupportedColumnType(field.type));
  const groups = groupFields(visibleFields);
  const uploadBlocked = props.uploadBlocked === true;
  const libraryStatus = props.libraryStatus || (props.demoMode ? "demo" : undefined);
  const [phase, setPhase] = React.useState<FormPhase>(props.initialResult ? "done" : "form");
  const [result, setResult] = React.useState<ISubmissionResult | undefined>(props.initialResult);
  const [file, setFile] = React.useState<File | undefined>(undefined);
  const [fileError, setFileError] = React.useState<string | undefined>(undefined);
  const [dragOver, setDragOver] = React.useState(false);
  const [values, setValues] = React.useState<IFieldValueMap>(() => props.initialValues || emptyValues(props.fields));
  const [fieldErrors, setFieldErrors] = React.useState<IFieldErrorMap>({});
  const [submitError, setSubmitError] = React.useState<string | undefined>(undefined);
  const [progress, setProgress] = React.useState<IUploadProgress | undefined>(undefined);
  const cancelRef = React.useRef(false);
  const generation = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const fieldKey = props.fields.map((field) => field.internalName).join("|");

  React.useEffect(() => {
    setValues(props.initialValues || emptyValues(props.fields));
    setFieldErrors({});
  }, [fieldKey, props.fields, props.initialValues]);

  const busy = phase === "uploading";
  const hint = fileHint(props.maxFileSizeMb, props.allowedExtensions);
  const siteProp = props.siteUrl || "";
  const libraryProp = props.libraryName || props.libraryTitle || "";
  const [siteDraft, setSiteDraft] = React.useState(siteProp);
  const [libraryDraft, setLibraryDraft] = React.useState(libraryProp);
  React.useEffect(() => {
    setSiteDraft(siteProp);
    setLibraryDraft(libraryProp);
  }, [siteProp, libraryProp]);

  const chooseFile = (next: File | undefined): void => {
    setFile(next);
    setSubmitError(undefined);
    if (!next) {
      setFileError(undefined);
      return;
    }
    const check = validateSelectedFile(next, {
      maxFileSizeMb: props.maxFileSizeMb,
      allowedExtensions: props.allowedExtensions
    });
    setFileError(check.ok ? undefined : check.message);
  };

  const openPicker = (): void => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const changeField = (internalName: string, value: FieldValue): void => {
    setValues((current) => ({ ...current, [internalName]: value }));
    setFieldErrors((current) => {
      if (!current[internalName]) {
        return current;
      }
      const next: IFieldErrorMap = { ...current };
      delete next[internalName];
      return next;
    });
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (busy) {
      return;
    }
    const nextFileError = !file
      ? "Choose a file to submit."
      : validateSelectedFile(file, {
        maxFileSizeMb: props.maxFileSizeMb,
        allowedExtensions: props.allowedExtensions
      }).message;
    const nextFieldErrors = validateFormValues(props.fields, values);
    setFileError(nextFileError);
    setFieldErrors(nextFieldErrors);
    if (nextFileError || hasFieldErrors(nextFieldErrors) || !file) {
      setSubmitError(undefined);
      return;
    }
    const selected = file;
    cancelRef.current = false;
    const current = generation.current + 1;
    generation.current = current;
    setPhase("uploading");
    setProgress(undefined);
    setSubmitError(undefined);
    const request: IFormSubmitRequest = {
      file: selected,
      values,
      onProgress: (update): void => {
        if (generation.current === current) {
          setProgress(update);
        }
      },
      isCancelled: (): boolean => cancelRef.current
    };
    props.onSubmit(request).then((submission) => {
      if (generation.current !== current) {
        return;
      }
      setResult(submission);
      setPhase("done");
    }).catch((error: unknown) => {
      if (generation.current !== current) {
        return;
      }
      setSubmitError(error instanceof Error && error.message ? error.message : "The document could not be submitted.");
      setPhase("form");
    });
  };

  const reset = (): void => {
    generation.current += 1;
    cancelRef.current = false;
    setPhase("form");
    setResult(undefined);
    setProgress(undefined);
    setFile(undefined);
    setFileError(undefined);
    setSubmitError(undefined);
    setFieldErrors({});
    setValues(emptyValues(props.fields));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  let body: React.ReactElement;
  if (props.loadingFields) {
    body = <Spinner label="Loading library columns" labelPosition="after" />;
  } else if (props.fieldsError && !props.demoMode && !uploadBlocked) {
    body = (
      <MessageBar intent="error">
        <MessageBarBody>
          {props.fieldsError}{" "}
          <Button appearance="transparent" onClick={props.onRetryFields}>Try again</Button>
        </MessageBarBody>
      </MessageBar>
    );
  } else if (phase === "done" && result) {
    body = <Confirmation styles={styles} result={result} onReset={reset} />;
  } else {
    body = (
      <form className={styles.form} onSubmit={onSubmit} noValidate aria-busy={busy}>
        {props.demoMode && (
          <MessageBar intent="info">
            <MessageBarBody>
              {props.demoMessage || "Demo mode. Nothing is written to SharePoint."}
            </MessageBarBody>
          </MessageBar>
        )}
        {props.fieldsError && <p className={styles.error} role="alert">{props.fieldsError}</p>}
        <FileDrop
          styles={styles}
          hint={hint}
          accept={acceptAttribute(props.allowedExtensions)}
          file={file}
          fileError={fileError}
          dragOver={dragOver}
          disabled={busy || uploadBlocked}
          inputRef={inputRef}
          onOpen={openPicker}
          onDragOver={(over): void => setDragOver(over)}
          onFile={chooseFile}
        />
        {groups.required.length > 0 && (
          <section className={styles.section} aria-label="Required">
            <h3 className={styles.sectionHeading}>Required</h3>
            {groups.required.map((field) => (
              <FieldControl
                key={field.internalName}
                field={field}
                value={values[field.internalName]}
                error={fieldErrors[field.internalName]}
                disabled={busy}
                onChange={changeField}
              />
            ))}
          </section>
        )}
        {groups.optional.length > 0 && (
          <section className={styles.section} aria-label="Optional metadata">
            <h3 className={styles.sectionHeading}>Optional metadata</h3>
            {groups.optional.map((field) => (
              <FieldControl
                key={field.internalName}
                field={field}
                value={values[field.internalName]}
                error={fieldErrors[field.internalName]}
                disabled={busy}
                onChange={changeField}
              />
            ))}
          </section>
        )}
        {phase === "uploading" && <UploadProgress styles={styles} fileName={file ? file.name : ""} progress={progress} onCancel={(): void => { cancelRef.current = true; }} />}
        {submitError && <p className={styles.error} role="alert">{submitError}</p>}
        <div className={styles.actions}>
          <Button
            className={ui.submit}
            appearance="primary"
            type="submit"
            data-submit="document"
            disabled={busy || props.loadingFields || uploadBlocked}
          >
            Submit document
          </Button>
        </div>
      </form>
    );
  }

  const title = phase === "done" && result ? resultHeading(result) : "Submit a document";
  const showExpand = Boolean(props.onExpand) && props.displayMode !== "fullscreen";

  return (
    <FadeSlideUp className={ui.shell}>
    <section className={`${styles.root} ${ui.card}`} aria-label="Submit a document" data-single-screen="true">
      <FadeSlideUp>
        <header className={ui.hero}>
          <div className={ui.heroGlyph} aria-hidden="true">
            <ArrowUpload24Regular />
          </div>
          <div className={ui.heroCopy}>
            <h2 className={`${styles.heading} ${ui.heading}`}>{title}</h2>
            <p className={ui.heroSubtitle}>{heroSubtitle(phase, result, siteDraft, libraryDraft)}</p>
            {libraryStatus && (
              <LibraryStatusBadge status={libraryStatus} libraryTitle={props.libraryTitle || libraryDraft || "Documents"} />
            )}
          </div>
          {showExpand && (
            <Button
              className={ui.heroExpand}
              appearance="subtle"
              type="button"
              aria-label="Expand"
              title="Expand"
              disabled={busy}
              icon={<ArrowExpand20Regular />}
              onClick={(): void => {
                const expand = props.onExpand;
                if (expand) {
                  expand().catch((error: unknown) => {
                    console.error("[CopilotSharePointForm] Couldn't expand the form.", error);
                  });
                }
              }}
            />
          )}
        </header>
      </FadeSlideUp>
      <div className={ui.body}>
        {phase !== "done" && (
          <FadeSlideUp delay>
            <DestinationBar
              siteUrl={siteDraft}
              libraryName={libraryDraft}
              disabled={busy || props.loadingFields === true}
              onSiteUrl={setSiteDraft}
              onLibraryName={setLibraryDraft}
              onLoad={(): void => {
                const load = props.onLoadTarget;
                if (load) {
                  load(siteDraft, libraryDraft);
                }
              }}
            />
          </FadeSlideUp>
        )}
        <p className={styles.copy}>
          {phase === "done" && result
            ? resultCopy(result)
            : `Choose a file and the columns for ${props.libraryTitle || libraryDraft || "the library"}. The file uploads from this form. It is not attached to the Copilot chat.`}
        </p>
        {body}
      </div>
    </section>
    </FadeSlideUp>
  );
}

function DestinationBar(props: {
  siteUrl: string;
  libraryName: string;
  disabled: boolean;
  onSiteUrl: (value: string) => void;
  onLibraryName: (value: string) => void;
  onLoad: () => void;
}): React.ReactElement {
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "Enter") {
      event.preventDefault();
      props.onLoad();
    }
  };
  return (
    <div className={ui.destination} data-destination="target">
      <div className={`${ui.destinationField} ${ui.destinationSite}`}>
        <Label htmlFor="target-site-url">Site URL</Label>
        <Input
          id="target-site-url"
          field="siteUrl"
          value={props.siteUrl}
          disabled={props.disabled}
          placeholder="https://contoso.sharepoint.com/sites/team"
          onKeyDown={onKeyDown}
          onChange={props.onSiteUrl}
        />
      </div>
      <div className={`${ui.destinationField} ${ui.destinationLibrary}`}>
        <Label htmlFor="target-library">Library</Label>
        <Input
          id="target-library"
          field="libraryName"
          value={props.libraryName}
          disabled={props.disabled}
          placeholder="Documents"
          onKeyDown={onKeyDown}
          onChange={props.onLibraryName}
        />
      </div>
      <button
        className={ui.loadLibrary}
        type="button"
        disabled={props.disabled}
        onClick={props.onLoad}
      >
        Load library
      </button>
      <p className={ui.hint}>A library name at the end of the site URL is moved into Library when you load.</p>
    </div>
  );
}

interface IStyleBag {
  styles: ReturnType<typeof useFormStyles>;
}

function FileDrop(props: IStyleBag & {
  hint: string;
  accept: string | undefined;
  file: File | undefined;
  fileError: string | undefined;
  dragOver: boolean;
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onOpen: () => void;
  onDragOver: (over: boolean) => void;
  onFile: (file: File | undefined) => void;
}): React.ReactElement {
  const styles = props.styles;
  const onDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    props.onDragOver(false);
    const list = event.dataTransfer.files;
    if (list && list.length > 0) {
      props.onFile(list[0]);
    }
  };
  return (
    <div
      className={props.dragOver ? `${styles.drop} ${styles.dropActive}` : styles.drop}
      onDragEnter={(event): void => {
        event.preventDefault();
        props.onDragOver(true);
      }}
      onDragOver={(event): void => {
        event.preventDefault();
        props.onDragOver(true);
      }}
      onDragLeave={(event): void => {
        event.preventDefault();
        props.onDragOver(false);
      }}
      onDrop={onDrop}
    >
      <ArrowUpload24Regular />
      <p className={styles.dropTitle}>Drag a file here</p>
      <p className={styles.hint} id="file-hint">{props.hint}</p>
      <input
        ref={props.inputRef}
        id="document-file"
        className={styles.fileInput}
        type="file"
        accept={props.accept}
        disabled={props.disabled}
        aria-label="Choose a file"
        aria-invalid={props.fileError ? true : undefined}
        aria-describedby={props.fileError ? "file-error" : "file-hint"}
        onChange={(event): void => {
          const list = event.currentTarget.files;
          if (list && list.length > 0) {
            props.onFile(list[0]);
          }
        }}
      />
      <Button appearance="secondary" type="button" disabled={props.disabled} onClick={props.onOpen}>
        Browse files
      </Button>
      {props.file && (
        <div className={styles.selected}>
          <p className={styles.fileName}>{props.file.name}</p>
          <p className={styles.hint}>{formatBytes(props.file.size)}</p>
          <Button
            appearance="transparent"
            type="button"
            disabled={props.disabled}
            onClick={(): void => {
              if (props.inputRef.current) {
                props.inputRef.current.value = "";
              }
              props.onFile(undefined);
            }}
          >
            Remove
          </Button>
        </div>
      )}
      {props.fileError && <p className={styles.error} id="file-error" role="alert">{props.fileError}</p>}
    </div>
  );
}

function UploadProgress(props: IStyleBag & {
  fileName: string;
  progress: IUploadProgress | undefined;
  onCancel: () => void;
}): React.ReactElement {
  const styles = props.styles;
  const progress = props.progress;
  const percent = progress ? progress.percent : 0;
  const loaded = progress ? formatBytes(progress.loadedBytes) : "0 B";
  const total = progress ? formatBytes(progress.totalBytes) : "";
  const mode = progress && progress.mode === "chunked"
    ? `Chunked upload, chunk ${progress.chunkIndex + 1} of ${progress.chunkCount}.`
    : "Direct upload.";
  return (
    <div>
      <p className={styles.progressCopy} role="status" aria-live="polite">
        {`Uploading ${props.fileName}. ${loaded}${total ? ` of ${total}` : ""} (${percent}%). ${progress ? mode : ""}`}
      </p>
      <ProgressBar value={percent / 100} thickness="large" aria-label="Upload progress" />
      <div className={styles.actions}>
        <Button appearance="secondary" type="button" onClick={props.onCancel}>Cancel upload</Button>
      </div>
    </div>
  );
}

function Confirmation(props: IStyleBag & {
  result: ISubmissionResult;
  onReset: () => void;
}): React.ReactElement {
  const styles = props.styles;
  const result = props.result;
  return (
    <div className={styles.section}>
      {result.demo && (
        <MessageBar intent="info">
          <MessageBarBody>Demo only. This file was not saved to SharePoint.</MessageBarBody>
        </MessageBar>
      )}
      <CheckmarkCircle24Regular />
      <dl className={styles.facts}>
        <dt className={styles.term}>File</dt>
        <dd className={styles.detail}>{result.fileName}</dd>
        <dt className={styles.term}>Size</dt>
        <dd className={styles.detail}>{formatBytes(result.sizeBytes)}</dd>
        <dt className={styles.term}>Library</dt>
        <dd className={styles.detail}>{result.libraryTitle}</dd>
        <dt className={styles.term}>Link</dt>
        <dd className={styles.detail}>
          <a className={styles.link} href={result.fileUrl}>{result.demo ? "Sample library link" : "Open file"}</a>
        </dd>
      </dl>
      {result.metadata.length > 0 && (
        <section className={styles.section} aria-label="Saved metadata">
          <h3 className={styles.sectionHeading}>Saved metadata</h3>
          <dl className={styles.facts}>
            {result.metadata.map((item) => (
              <React.Fragment key={item.internalName}>
                <dt className={styles.term}>{item.title}</dt>
                <dd className={styles.detail}>{item.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        </section>
      )}
      <div className={styles.actions}>
        <Button appearance="secondary" type="button" onClick={props.onReset}>Submit another document</Button>
      </div>
    </div>
  );
}

function heroSubtitle(
  phase: FormPhase,
  result: ISubmissionResult | undefined,
  siteUrl: string,
  libraryName: string
): string {
  if (phase === "done" && result) {
    return resultCopy(result);
  }
  const library = libraryName.trim() || "Documents";
  const site = siteUrl.trim();
  if (site) {
    return `${library} on ${site}`;
  }
  return `Set the site and library, then choose a file. ${library} is the library until you change it.`;
}

function resultHeading(result: ISubmissionResult): string {
  return result.demo ? "Demo submission complete" : "Document submitted";
}

function resultCopy(result: ISubmissionResult): string {
  if (result.demo) {
    return `${result.fileName} finished the demo upload to ${result.libraryTitle}. Nothing was written to SharePoint.`;
  }
  return `${result.fileName} is in ${result.libraryTitle}.`;
}

function fileHint(maxFileSizeMb: number, extensions: string[]): string {
  const allowed = effectiveAllowedExtensions(extensions);
  return `Up to ${maxFileSizeMb} MB. Allowed types: ${allowed.join(", ")}.`;
}

function formPrefix(instanceId: string | undefined): string {
  const source = instanceId && instanceId.trim() ? instanceId.trim() : "webpart";
  const safe = source.replace(/[^A-Za-z0-9_-]/g, "");
  return `copilot-form-${safe || "webpart"}-`;
}
