import {
  absoluteFileUrl,
  cancelUploadMethod,
  continueUploadMethod,
  directUploadUrl,
  fileMethodUrl,
  finishUploadMethod,
  LIST_FIELDS_SUFFIX,
  listByTitleUrl,
  startUploadMethod
} from "./sharePointUrls";

describe("SharePoint REST urls", () => {
  const web = "https://contoso.sharepoint.com/sites/hr";

  it("builds the direct add url and escapes apostrophes", () => {
    expect(directUploadUrl(web, "/sites/hr/Shared Documents", "team's policy.pdf", true)).toBe(
      "https://contoso.sharepoint.com/sites/hr/_api/web/GetFolderByServerRelativePath(decodedUrl='/sites/hr/Shared Documents')/Files/add(overwrite=true,url='team''s policy.pdf')"
    );
    expect(directUploadUrl(web, "/sites/hr/Policies", "a.pdf", false)).toContain("overwrite=false");
  });

  it("builds chunked upload methods on the file path", () => {
    const file = fileMethodUrl(web, "/sites/hr/Shared Documents/a.pdf", startUploadMethod("abc"));
    expect(file).toContain("/GetFileByServerRelativePath(decodedUrl='/sites/hr/Shared Documents/a.pdf')/StartUpload(uploadId=guid'abc')");
    expect(continueUploadMethod("abc", 10485760)).toBe("ContinueUpload(uploadId=guid'abc',fileOffset=10485760)");
    expect(finishUploadMethod("abc", 20971520)).toBe("FinishUpload(uploadId=guid'abc',fileOffset=20971520)");
    expect(cancelUploadMethod("abc")).toBe("CancelUpload(uploadId=guid'abc')");
  });

  it("asks the library for visible editable columns and links the uploaded file", () => {
    const fields = listByTitleUrl(web, "Team's Files", LIST_FIELDS_SUFFIX);
    expect(fields).toContain("getByTitle('Team''s Files')");
    expect(fields).toContain("$filter=Hidden eq false and ReadOnlyField eq false");
    expect(absoluteFileUrl(web, "/sites/hr/Shared Documents/a b.pdf")).toBe(
      "https://contoso.sharepoint.com/sites/hr/Shared%20Documents/a%20b.pdf"
    );
  });
});
