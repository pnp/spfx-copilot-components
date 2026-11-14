import type { IEditableField } from "../models";

/** Sample Title, Description, and Choice columns for the workbench. Person columns are not included. */
export function demoFields(): IEditableField[] {
  return [
    {
      internalName: "Title",
      title: "Document Title",
      description: "Name readers will see in the library.",
      type: "Text",
      required: true,
      choices: []
    },
    {
      internalName: "Description",
      title: "Description",
      description: "",
      type: "Note",
      required: false,
      choices: []
    },
    {
      internalName: "Department",
      title: "Department",
      description: "",
      type: "Choice",
      required: true,
      choices: ["Finance", "Human Resources", "Legal", "Operations"]
    }
  ];
}
