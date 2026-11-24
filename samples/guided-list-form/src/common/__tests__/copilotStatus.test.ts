import { COPILOT_INLINE_HEIGHT_PX, listModelContext, loadFailedFollowUp, openedFollowUp, pickedListFollowUp, statusChannel, submitFailedStatus, submitUnknownStatus, submittedStatus, writesModelContext } from '../logic/copilotStatus';
import { submittedFollowUp } from '../logic/config';

describe('Copilot status lines', () => {
  it('says the form opened and has not been submitted, without answers', () => {
    expect(openedFollowUp('IT Requests')).toBe(
      'The guided form opened the IT Requests list. The person is filling it in; it has not been submitted.'
    );
  });

  it('says clearly when the list was not found or could not be opened', () => {
    const missing = loadFailedFollowUp('IT Requests', 'notFound');
    expect(missing).toContain('couldn\u2019t open the list \u201cIT Requests\u201d');
    expect(missing).toContain('was not found');
    expect(missing).toContain('must choose a site and a list');
    expect(missing).toContain('Nothing has been filled in or submitted');
    expect(loadFailedFollowUp('IT Requests', 'accessDenied')).toContain('doesn\u2019t have access');
    expect(loadFailedFollowUp('', 'empty')).toContain('pick a site and list');
    expect(loadFailedFollowUp('IT Requests', 'empty')).not.toContain('IT Requests');
  });

  it('reports a newly picked list', () => {
    expect(pickedListFollowUp('Lumen milestones')).toContain('is now using the Lumen milestones list');
    expect(pickedListFollowUp('Lumen milestones')).toContain('has not been submitted');
  });

  it('never includes answers or list items in any status line', () => {
    const lines = [
      openedFollowUp('IT Requests'),
      loadFailedFollowUp('IT Requests', 'notFound'),
      loadFailedFollowUp('IT Requests', 'network'),
      pickedListFollowUp('IT Requests'),
      submittedFollowUp('IT Requests'),
      submittedStatus('Annual Processes'),
      submitFailedStatus('Annual Processes', 'validation')
    ].join('\n');
    expect(lines).not.toMatch(/New laptop|Hardware|prefill[^\s]*:|\{"/i);
  });

  it('says a new item was added, with the list name and no item content', () => {
    expect(submittedStatus('Annual Processes')).toBe('The guided form added a new item to the Annual Processes list.');
    expect(submittedFollowUp('Annual Processes')).toBe(submittedStatus('Annual Processes'));
    expect(submittedStatus('<script>')).toBe('The guided form added a new list item.');
  });

  it('says a failed save was not submitted and names the error kind, not the answers', () => {
    expect(submitFailedStatus('Annual Processes', 'accessDenied')).toBe(
      'The guided form did not add an item to the Annual Processes list. The person does not have permission. It was not submitted.'
    );
    expect(submitFailedStatus('Annual Processes', 'timeout')).toContain('took too long to respond');
    expect(submitFailedStatus('Annual Processes', 'timeout')).toContain('not confirmed yet');
    expect(submitFailedStatus('Annual Processes', 'timeout')).not.toContain('not submitted');
    expect(submitFailedStatus('Annual Processes', 'validation')).toContain('Some answers were not accepted');
    expect(submitFailedStatus('Annual Processes', 'network')).toContain('could not be reached');
    expect(submitFailedStatus('', 'server')).toBe(
      'The guided form did not add an item to the list. Something went wrong while saving. It was not submitted.'
    );
  });

  it('asks Copilot for a 600 px inline height', () => {
    expect(COPILOT_INLINE_HEIGHT_PX).toBe(600);
  });

  it('sends chosen, opened, empty and load failures as model context, and submit results as a chat follow-up that also refreshes model context', () => {
    expect(statusChannel('chosen')).toBe('modelContext');
    expect(statusChannel('opened')).toBe('modelContext');
    expect(statusChannel('empty')).toBe('modelContext');
    expect(statusChannel('failed')).toBe('modelContext');
    expect(statusChannel('submitted')).toBe('followUp');
    expect(statusChannel('notSubmitted')).toBe('followUp');
    expect(writesModelContext('opened')).toBe(true);
    expect(writesModelContext('submitted')).toBe(true);
    expect(writesModelContext('notSubmitted')).toBe(true);
  });

  it('puts the chosen list in model context so a remount can reopen it, without answers', () => {
    expect(listModelContext({
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'IT Requests',
      status: 'chosen'
    })).toEqual({
      status: 'chosen',
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'IT Requests'
    });
    expect(listModelContext({ status: 'empty' })).toEqual({ status: 'empty' });
    expect(JSON.stringify(listModelContext({
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'IT Requests',
      status: 'opened'
    }))).not.toMatch(/New laptop|Hardware|password/i);
  });

  it('replaces opened with submitted (or notSubmitted and the error kind) in model context, without item content', () => {
    expect(listModelContext({
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes',
      status: 'submitted'
    })).toEqual({
      status: 'submitted',
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes'
    });
    expect(listModelContext({
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes',
      status: 'notSubmitted',
      errorKind: 'accessDenied'
    })).toEqual({
      status: 'notSubmitted',
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes',
      errorKind: 'accessDenied'
    });
    expect(JSON.stringify(listModelContext({
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes',
      status: 'submitted'
    }))).not.toMatch(/New laptop|Hardware|password|DispForm/i);
  });

  it('says a timed-out save is not confirmed yet, never that it was not submitted', () => {
    expect(submitUnknownStatus('Annual Processes')).toBe(
      'The guided form sent a save to the Annual Processes list. SharePoint took too long to respond. The outcome is not confirmed yet.'
    );
    expect(submitUnknownStatus('')).toContain('the list');
    expect(submitUnknownStatus('Annual Processes')).not.toMatch(/not submitted|\bfree\b|\u2013|\u2014/);
    expect(statusChannel('unknown')).toBe('followUp');
    expect(writesModelContext('unknown')).toBe(true);
    expect(listModelContext({
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes',
      status: 'unknown',
      errorKind: 'timeout'
    })).toEqual({
      status: 'unknown',
      siteUrl: 'https://contoso.sharepoint.com/sites/it',
      listName: 'Annual Processes',
      errorKind: 'timeout'
    });
  });
});
