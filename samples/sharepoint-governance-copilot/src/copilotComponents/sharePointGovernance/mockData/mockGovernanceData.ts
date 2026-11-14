import { IGovernanceRisk } from '../models/IGovernanceRisk';

/** Governance score from the previous reporting period, used to derive the trend indicator. */
export const mockPreviousGovernanceScore = 54;

export const mockGovernanceRisks: IGovernanceRisk[] = [
  {
    id: '1',
    siteName: 'Contoso Legal - M&A Workspace',
    siteUrl: 'https://contoso.sharepoint.com/sites/legal-manda',
    type: 'missingOwner',
    severity: 'high',
    reason: 'No active owner was found after the last quarterly access review.',
    impact: 'Site accountability is missing, so no one is responsible for access decisions or data lifecycle.',
    whyItMatters: 'Without an accountable owner, access reviews and compliance attestations cannot be completed, increasing audit risk for a legal matter site.',
    recommendedAction: 'Assign at least two business owners and confirm them in the next access review cycle.',
    ctaLabel: 'Assign Owner',
    ownerCount: 0,
    lastActivityDate: '2026-08-20'
  },
  {
    id: '2',
    siteName: 'Global Marketing Hub',
    siteUrl: 'https://contoso.sharepoint.com/sites/marketing-hub',
    type: 'broadSharing',
    severity: 'high',
    reason: 'Anyone links are enabled tenant-wide with no expiration date configured.',
    impact: 'Content can be accessed by anyone with the link, including people outside the organization, indefinitely.',
    whyItMatters: 'Unrestricted, non-expiring sharing links are one of the most common causes of unintended data exposure in SharePoint tenants.',
    recommendedAction: 'Disable or expire anonymous sharing links and switch to specific-people sharing.',
    ctaLabel: 'Review Permissions',
    ownerCount: 3,
    lastActivityDate: '2026-09-28'
  },
  {
    id: '3',
    siteName: 'Project Phoenix (Legacy)',
    siteUrl: 'https://contoso.sharepoint.com/sites/project-phoenix',
    type: 'inactive',
    severity: 'medium',
    reason: 'No user activity detected in the last 180 days.',
    impact: 'The site consumes storage and remains discoverable without delivering ongoing business value.',
    whyItMatters: 'Abandoned sites accumulate stale permissions and content that nobody is actively monitoring, widening the attack surface.',
    recommendedAction: 'Confirm with the business whether the site should be archived or re-engaged, and review its current access list.',
    ctaLabel: 'Start Access Review',
    ownerCount: 1,
    lastActivityDate: '2026-03-15'
  },
  {
    id: '4',
    siteName: 'Finance Shared Services',
    siteUrl: 'https://contoso.sharepoint.com/sites/finance-shared-services',
    type: 'expiring',
    severity: 'medium',
    reason: 'Site lifecycle review is due in 12 days; no renewal request submitted.',
    impact: "The site will be flagged for retirement if the review isn't completed in time.",
    whyItMatters: 'Missed lifecycle reviews can interrupt access to shared financial resources without warning.',
    recommendedAction: 'Submit a renewal request or confirm retirement before the review deadline.',
    ctaLabel: 'Start Access Review',
    ownerCount: 2,
    expirationDate: '2026-10-15'
  },
  {
    id: '5',
    siteName: 'Partner Extranet - Fabrikam',
    siteUrl: 'https://contoso.sharepoint.com/sites/partners-fabrikam',
    type: 'broadSharing',
    severity: 'high',
    reason: 'External guests outnumber internal members by more than 3x.',
    impact: 'The majority of people with access to this site are outside the organization.',
    whyItMatters: 'A guest-heavy membership increases the chance of oversharing and makes it harder to apply least-privilege access.',
    recommendedAction: 'Review the guest list, remove inactive guests, and confirm the remaining access is still required.',
    ctaLabel: 'Review Guest Access',
    ownerCount: 1,
    externalGuestCount: 18,
    lastActivityDate: '2026-09-30'
  },
  {
    id: '6',
    siteName: 'HR Policies Portal',
    siteUrl: 'https://contoso.sharepoint.com/sites/hr-policies',
    type: 'missingOwner',
    severity: 'medium',
    reason: 'The last registered owner left the organization 45 days ago.',
    impact: "Site accountability lapsed when the owner's account was deactivated.",
    whyItMatters: 'HR content often includes sensitive policy and personnel information that requires an accountable owner at all times.',
    recommendedAction: 'Assign a new owner from the HR leadership team as soon as possible.',
    ctaLabel: 'Assign Owner',
    ownerCount: 0,
    lastActivityDate: '2026-07-02'
  },
  {
    id: '7',
    siteName: 'Regional Sales - EMEA',
    siteUrl: 'https://contoso.sharepoint.com/sites/sales-emea',
    type: 'inactive',
    severity: 'low',
    reason: 'Activity has dropped by 80% compared to the previous quarter.',
    impact: 'Engagement is trending toward zero, though the site is not yet fully dormant.',
    whyItMatters: 'Early, low-severity activity drops are the best opportunity to re-engage a site before it becomes a governance risk.',
    recommendedAction: 'Check in with the regional sales team to confirm the site is still needed.',
    ctaLabel: 'Start Access Review',
    ownerCount: 4,
    lastActivityDate: '2026-06-18'
  },
  {
    id: '8',
    siteName: 'Executive Leadership Site',
    siteUrl: 'https://contoso.sharepoint.com/sites/executive-leadership',
    type: 'expiring',
    severity: 'low',
    reason: 'Confidential site scheduled for annual access recertification in 30 days.',
    impact: 'Access recertification has not yet started for a highly confidential site.',
    whyItMatters: "Executive and confidential sites carry higher consequences if stale access isn't caught during recertification.",
    recommendedAction: 'Start the access recertification process now rather than waiting for the deadline.',
    ctaLabel: 'Start Access Review',
    ownerCount: 2,
    expirationDate: '2026-11-02'
  }
];


