import type { MSGraphClientFactory } from '@microsoft/sp-http';
import { GraphProfileService, isPermissionError } from './GraphProfileService';

interface IRecordedRequest {
  path: string;
  select?: string;
  orderby?: string;
  top?: number;
  query?: Record<string, string>;
}

function createFactory(responses: Record<string, unknown>): {
  factory: MSGraphClientFactory;
  getClient: jest.Mock;
  requests: IRecordedRequest[];
} {
  const requests: IRecordedRequest[] = [];
  const client = {
    api: (path: string) => {
      const request: IRecordedRequest = { path };
      requests.push(request);
      const builder = {
        select: (value: string) => {
          request.select = value;
          return builder;
        },
        orderby: (value: string) => {
          request.orderby = value;
          return builder;
        },
        top: (value: number) => {
          request.top = value;
          return builder;
        },
        query: (value: Record<string, string>) => {
          request.query = value;
          return builder;
        },
        get: async () => {
          const response: unknown = responses[path];
          if (response instanceof Error) {
            throw response;
          }
          return response;
        }
      };
      return builder;
    }
  };
  const getClient: jest.Mock = jest.fn().mockResolvedValue(client);
  return { factory: { getClient } as unknown as MSGraphClientFactory, getClient, requests };
}

describe('GraphProfileService.getProfile', () => {
  it('requests only the profile fields it shows', async () => {
    const { factory, getClient, requests } = createFactory({
      '/me': { displayName: 'Megan Bowen', jobTitle: 'Manager', mail: 'megan@contoso.com' }
    });

    const profile = await new GraphProfileService(factory).getProfile();

    expect(getClient).toHaveBeenCalledWith('3');
    expect(requests[0]).toEqual({
      path: '/me',
      select: 'displayName,jobTitle,mail,userPrincipalName'
    });
    expect(profile).toEqual({
      displayName: 'Megan Bowen',
      jobTitle: 'Manager',
      mail: 'megan@contoso.com'
    });
  });

  it('uses the user principal name and an empty job title when fields are null', async () => {
    const { factory } = createFactory({
      '/me': {
        displayName: 'Lee Gu',
        jobTitle: null,
        mail: null,
        userPrincipalName: 'lee@contoso.com'
      }
    });

    const profile = await new GraphProfileService(factory).getProfile();

    expect(profile).toEqual({ displayName: 'Lee Gu', jobTitle: '', mail: 'lee@contoso.com' });
  });
});

describe('GraphProfileService.getMessages', () => {
  it('requests the 10 most recent messages', async () => {
    const { factory, requests } = createFactory({ '/me/messages': { value: [] } });

    await new GraphProfileService(factory).getMessages();

    expect(requests[0]).toEqual({
      path: '/me/messages',
      select: 'id,subject,from,receivedDateTime,isRead',
      orderby: 'receivedDateTime desc',
      top: 10
    });
  });

  it('maps the response to messages', async () => {
    const { factory } = createFactory({
      '/me/messages': {
        value: [
          {
            id: 'm1',
            subject: 'Q3 budget',
            from: { emailAddress: { name: 'Diego Siciliani', address: 'diego@contoso.com' } },
            receivedDateTime: '2026-09-29T08:00:00Z',
            isRead: false
          }
        ]
      }
    });

    const messages = await new GraphProfileService(factory).getMessages();

    expect(messages).toEqual([
      {
        id: 'm1',
        subject: 'Q3 budget',
        from: 'Diego Siciliani',
        received: '2026-09-29T08:00:00Z',
        isRead: false
      }
    ]);
  });

  it('handles a message with no subject and no sender', async () => {
    const { factory } = createFactory({
      '/me/messages': {
        value: [{ id: 'm2', subject: null, receivedDateTime: '2026-09-29T09:00:00Z', isRead: true }]
      }
    });

    const messages = await new GraphProfileService(factory).getMessages();

    expect(messages[0].subject).toBe('(No subject)');
    expect(messages[0].from).toBe('');
  });

  it('returns an empty array for an empty inbox', async () => {
    const { factory } = createFactory({ '/me/messages': { value: [] } });

    expect(await new GraphProfileService(factory).getMessages()).toEqual([]);
  });
});

describe('GraphProfileService.getEvents', () => {
  const NOW: Date = new Date('2026-10-01T12:00:00.000Z');

  it('requests the events of the next 7 days in start order', async () => {
    const { factory, requests } = createFactory({ '/me/calendarView': { value: [] } });

    await new GraphProfileService(factory).getEvents(NOW);

    expect(requests[0]).toEqual({
      path: '/me/calendarView',
      query: {
        startDateTime: '2026-10-01T12:00:00.000Z',
        endDateTime: '2026-10-08T12:00:00.000Z'
      },
      select: 'id,subject,start,end,location',
      orderby: 'start/dateTime',
      top: 25
    });
  });

  it('maps the response to events with UTC times', async () => {
    const { factory } = createFactory({
      '/me/calendarView': {
        value: [
          {
            id: 'e1',
            subject: 'Team sync',
            start: { dateTime: '2026-10-02T09:00:00.0000000', timeZone: 'UTC' },
            end: { dateTime: '2026-10-02T09:30:00.0000000', timeZone: 'UTC' },
            location: { displayName: 'Room 4' }
          }
        ]
      }
    });

    const events = await new GraphProfileService(factory).getEvents(NOW);

    expect(events).toEqual([
      {
        id: 'e1',
        subject: 'Team sync',
        start: '2026-10-02T09:00:00Z',
        end: '2026-10-02T09:30:00Z',
        location: 'Room 4'
      }
    ]);
  });

  it('handles an event with no subject and no location', async () => {
    const { factory } = createFactory({
      '/me/calendarView': {
        value: [
          {
            id: 'e2',
            subject: null,
            start: { dateTime: '2026-10-03T09:00:00.0000000', timeZone: 'UTC' },
            end: { dateTime: '2026-10-03T10:00:00.0000000', timeZone: 'UTC' }
          }
        ]
      }
    });

    const events = await new GraphProfileService(factory).getEvents(NOW);

    expect(events[0].subject).toBe('(No subject)');
    expect(events[0].location).toBe('');
  });
});

describe('GraphProfileService client', () => {
  it('creates the Graph client once for several calls', async () => {
    const { factory, getClient } = createFactory({
      '/me': { displayName: 'Megan Bowen' },
      '/me/messages': { value: [] }
    });
    const service = new GraphProfileService(factory);

    await service.getProfile();
    await service.getMessages();

    expect(getClient).toHaveBeenCalledTimes(1);
  });
});

describe('isPermissionError', () => {
  it('is true for a 403 response', () => {
    expect(isPermissionError({ statusCode: 403, message: 'Access is denied.' })).toBe(true);
  });

  it('is true for a 401 response', () => {
    expect(isPermissionError({ statusCode: 401, message: 'Unauthorized' })).toBe(true);
  });

  it('is true for a consent error from token acquisition', () => {
    expect(isPermissionError(new Error('AADSTS65001: The user or administrator has not consented'))).toBe(true);
  });

  it('is false for other errors', () => {
    expect(isPermissionError(new Error('Network request failed'))).toBe(false);
    expect(isPermissionError(undefined)).toBe(false);
  });
});
