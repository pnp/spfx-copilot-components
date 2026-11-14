import * as React from "react";
import type { FieldValue, IEditableField } from "../models";
import { isSupportedColumnType } from "../logic/configuredColumns";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Select } from "./ui/Select";
import { Textarea } from "./ui/Textarea";
import fieldStyles from "./ui/ui.module.scss";

export interface IFieldControlProps {
  field: IEditableField;
  value: FieldValue | undefined;
  error?: string;
  disabled: boolean;
  onChange: (internalName: string, value: FieldValue) => void;
}

export function FieldControl(props: IFieldControlProps): React.ReactElement {
  const field = props.field;
  if (!isSupportedColumnType(field.type)) {
    return <></>;
  }
  const id = `field-${field.internalName}`;
  const errorId = props.error ? `${id}-error` : undefined;
  const hintId = field.description ? `${id}-hint` : undefined;
  const describedBy = [hintId, errorId].filter((item): item is string => Boolean(item)).join(" ") || undefined;
  const text = typeof props.value === "string" ? props.value : "";
  const onChange = (value: string): void => props.onChange(field.internalName, value);

  return (
    <div className={fieldStyles.field}>
      <Label htmlFor={id} required={field.required}>{field.title}</Label>
      {field.type === "Note" && (
        <Textarea
          id={id}
          field={field.internalName}
          value={text}
          disabled={props.disabled}
          required={field.required}
          invalid={Boolean(props.error)}
          describedBy={describedBy}
          onChange={onChange}
        />
      )}
      {field.type === "Choice" && (
        <Select
          id={id}
          field={field.internalName}
          value={text}
          choices={field.choices}
          disabled={props.disabled}
          required={field.required}
          invalid={Boolean(props.error)}
          describedBy={describedBy}
          onChange={onChange}
        />
      )}
      {field.type === "Text" && (
        <Input
          id={id}
          field={field.internalName}
          value={text}
          disabled={props.disabled}
          required={field.required}
          invalid={Boolean(props.error)}
          describedBy={describedBy}
          onChange={onChange}
        />
      )}
      {field.description && <p className={fieldStyles.hint} id={hintId}>{field.description}</p>}
      {props.error && <p className={fieldStyles.error} id={errorId} role="alert">{props.error}</p>}
    </div>
  );
}

export function LibraryStatusBadge(props: { status: "verified" | "missing" | "invalid" | "demo"; libraryTitle: string }): React.ReactElement {
  const label = props.status === "verified"
    ? "Verified library"
    : props.status === "demo"
      ? "Sample library"
      : props.status === "missing"
        ? "Library not found"
        : "Not a document library";
  return <Badge tone={props.status}>{`${label}: ${props.libraryTitle}`}</Badge>;
}
