define([], function () {
  return {
    "PropertyPaneDescription": "Choose the one document library this form submits to.",
    "SettingsGroupName": "Document library",
    "SiteUrlLabel": "Site URL",
    "SiteUrlDescription": "Leave blank to use the site where this web part is placed.",
    "SiteUrlError": "Enter an https SharePoint site URL on the current tenant, or leave it blank.",
    "LibraryTitleLabel": "Library title",
    "LibraryTitleDescription": "The title of one document library, such as Documents or Policies.",
    "LibraryTitleError": "Enter the document library title.",
    "LibraryNameLabel": "Library name",
    "LibraryNameDescription": "Document library that receives the file, such as Documents or Policies. Leave blank to use Documents. The form checks that this library exists before upload.",
    "ConfiguredColumnsLabel": "Form columns",
    "ConfiguredColumnsDescription": "Optional JSON array of columns to show. Each item has internalName, label, type (Text, Note, or Choice), required, and optional choices. Leave blank to use the library's text, note, and choice columns. Person columns are ignored.",
    "MaxFileSizeLabel": "Maximum file size (MB)",
    "MaxFileSizeDescription": "Whole number from 1 to 50. Larger files are rejected in the form.",
    "MaxFileSizeError": "Enter a whole number of megabytes from 1 to 50.",
    "AllowedExtensionsLabel": "Allowed extensions",
    "AllowedExtensionsDescription": "Comma-separated list of allowed extensions from .pdf,.docx,.xlsx,.pptx,.md,.png,.jpg (.md and .markdown both allow Markdown). Leave blank to allow all of .pdf,.docx,.xlsx,.pptx,.md,.png,.jpg.",
    "OverwriteLabel": "Overwrite existing files"
  }
});
