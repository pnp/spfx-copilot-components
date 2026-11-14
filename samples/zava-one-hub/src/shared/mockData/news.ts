import { embeddedMedia } from '../media/embeddedMedia';
import type { IZavaNewsStory } from '../models/zavaOne';
import { isoAtDayOffset } from '../utils/evergreenDates';

export const zavaNews: readonly IZavaNewsStory[] = [
  {
    id: 'news-one-zava', title: 'One Zava, closer to every customer',
    summary: 'Our next chapter connects product, service, and field teams around the moments customers value most.',
    detail: 'Leaders shared a focused plan to shorten the distance between customer insight and product decisions. Three cross-region teams will begin with onboarding, service recovery, and accessible collaboration.',
    category: 'Leadership', region: 'Global', publishedAt: isoAtDayOffset(-1, 8), expiresAt: isoAtDayOffset(45, 23, 59),
    imageUrl: embeddedMedia.oneZava, imageAlt: 'Zava colleagues gathered around a table for a strategy workshop',
    authorId: 'person-miriam', featured: true
  },
  {
    id: 'news-helsinki-lab', title: 'Helsinki opens an accessibility innovation lab',
    summary: 'A new employee-led lab gives product teams a practical place to test inclusive experiences together.',
    detail: 'The Helsinki team partnered with customers and accessibility specialists to create repeatable testing clinics, assistive technology stations, and an open design review every Thursday.',
    category: 'Innovation', region: 'Finland', publishedAt: isoAtDayOffset(-2, 7, 30), expiresAt: isoAtDayOffset(52, 23, 59),
    imageUrl: embeddedMedia.helsinkiLab, imageAlt: 'Colleagues collaborating around a laptop in an innovation lab',
    authorId: 'person-johanna', featured: false
  },
  {
    id: 'news-aurora', title: 'Project Aurora reaches its first customer milestone',
    summary: 'The Aurora team completed its first guided customer deployment two weeks ahead of the learning checkpoint.',
    detail: 'The milestone reflects close work across engineering, design, and customer success. The team will publish the reusable deployment pattern after the upcoming accessibility review.',
    category: 'Customer impact', region: 'Global', publishedAt: isoAtDayOffset(-3, 15), expiresAt: isoAtDayOffset(48, 23, 59),
    imageUrl: embeddedMedia.projectAurora, imageAlt: 'Project team reviewing ideas together in a bright studio',
    authorId: 'person-diego', featured: false
  },
  {
    id: 'news-town-hall', title: 'Global town hall: building our next chapter',
    summary: 'Join the next live conversation, with local watch rooms and an accessible recording afterward.',
    detail: 'The agenda includes customer stories, the new sustainability scorecard, and a live question session. Captions, transcript, and a recording will be available in every supported region.',
    category: 'Events', region: 'Global', publishedAt: isoAtDayOffset(-4, 9), expiresAt: isoAtDayOffset(30, 23, 59),
    imageUrl: embeddedMedia.globalTownHall, imageAlt: 'Speaker presenting to a large audience at a company event',
    authorId: 'person-miriam', featured: false
  },
  {
    id: 'news-singapore', title: 'Singapore turns support insight into product improvements',
    summary: 'A weekly customer signal review has already removed three recurring sources of setup friction.',
    detail: 'Support and product colleagues now review a shared evidence set every Friday. The first improvements simplify workspace setup and make recovery guidance easier to find.',
    category: 'Customer impact', region: 'Singapore', publishedAt: isoAtDayOffset(-5, 3), expiresAt: isoAtDayOffset(60, 23, 59),
    imageUrl: embeddedMedia.singaporeSupport, imageAlt: 'Customer support team discussing insights during a meeting',
    authorId: 'person-pradeep', featured: false
  },
  {
    id: 'news-community', title: 'Community week brings 1,200 volunteer hours to local partners',
    summary: 'Teams across six offices worked with local organizations on digital skills and inclusive employment.',
    detail: 'Colleagues hosted mentoring sessions, refurbished devices, and created accessible learning materials. Local teams can nominate the next partner through the end of the month.',
    category: 'Community', region: 'Global', publishedAt: isoAtDayOffset(-6, 12), expiresAt: isoAtDayOffset(60, 23, 59),
    imageUrl: embeddedMedia.communityWeek, imageAlt: 'Colleagues enjoying time together outdoors',
    authorId: 'person-nestor', featured: false
  },
  {
    id: 'news-learning', title: 'Learning festival opens with 40 practical sessions',
    summary: 'A two-week program connects required learning with hands-on sessions led by Zava practitioners.',
    detail: 'The program includes customer storytelling, accessible collaboration, data responsibility, and manager clinics. Every live session includes a recording and transcript.',
    category: 'Learning', region: 'Global', publishedAt: isoAtDayOffset(-7, 10), expiresAt: isoAtDayOffset(42, 23, 59),
    imageUrl: embeddedMedia.learningFestival, imageAlt: 'A diverse group learning together around a table',
    authorId: 'person-patti', featured: false
  },
  {
    id: 'news-customer-stories', title: 'Customer story studio opens for every team',
    summary: 'A new studio and coaching program helps teams turn evidence into clear, respectful customer narratives.',
    detail: 'The studio provides recording space, interview guidance, accessibility checks, and reusable templates. Teams can reserve a coached session from the Zava workplace hub.',
    category: 'Culture', region: 'Seattle', publishedAt: isoAtDayOffset(-8, 16), expiresAt: isoAtDayOffset(65, 23, 59),
    imageUrl: embeddedMedia.customerStories, imageAlt: 'Bright collaborative office prepared for a customer workshop',
    authorId: 'person-megan', featured: false
  }
];