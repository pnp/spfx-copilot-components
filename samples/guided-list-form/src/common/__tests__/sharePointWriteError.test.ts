import { ListFormError } from '../services/IListFormService';
import {
  hasSharePointWriteException,
  parseSharePointWriteError,
  requiredSubmitMessage,
  SUBMIT_TIMEOUT_MS,
  SUBMIT_TIMEOUT_MESSAGE,
  withTimeout
} from '../logic/sharePointWriteError';
import { FIELDS } from './helpers';

describe('parseSharePointWriteError', () => {
  it('reads an OData nometadata error message from a POST /items body', () => {
    expect(
      parseSharePointWriteError({
        'odata.error': { code: '-1, Microsoft.SharePoint.SPException', message: { lang: 'en-US', value: "Required field 'Title' cannot be empty." } }
      }, 400)
    ).toBe("Required field 'Title' cannot be empty.");
  });

  it('reads a verbose or string error.message', () => {
    expect(parseSharePointWriteError({ error: { message: 'A value must be provided for item in the request.' } }, 400)).toBe(
      'A value must be provided for item in the request.'
    );
  });

  it('reads per-field HasException rows from a 200 ValidateUpdate body', () => {
    const body = {
      value: [
        { FieldName: 'Title', FieldValue: '', HasException: true, ErrorMessage: "The required field Title cannot be empty." },
        { FieldName: 'Category', FieldValue: '', HasException: true, ErrorMessage: 'Please choose a category.' },
        { FieldName: 'Id', FieldValue: '0', HasException: false, ErrorMessage: '' }
      ]
    };
    expect(hasSharePointWriteException(body)).toBe(true);
    expect(parseSharePointWriteError(body, 200)).toBe("The required field Title cannot be empty. Please choose a category.");
  });

  it('ignores a successful body and strips control characters', () => {
    expect(hasSharePointWriteException({ Id: 12, Title: 'Ok' })).toBe(false);
    expect(parseSharePointWriteError({ Id: 12 }, 201)).toBeUndefined();
    expect(parseSharePointWriteError({ error: { message: { value: 'Bad\u0007 value' } } }, 400)).toBe('Bad value');
  });
});

describe('requiredSubmitMessage', () => {
  it('names the empty required fields', () => {
    expect(requiredSubmitMessage(FIELDS, {})).toBe('Please fill in What do you need? and Category.');
    expect(requiredSubmitMessage(FIELDS, { Title: 'Laptop', Category: 'Hardware' })).toBeUndefined();
    expect(requiredSubmitMessage([FIELDS[0]], {})).toBe('Please fill in What do you need?.');
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('rejects with a timeout error when the work never settles', async () => {
    const pending = withTimeout(new Promise(() => undefined), SUBMIT_TIMEOUT_MS);
    const settled = pending.then(
      () => 'resolved',
      (error: unknown) => error
    );
    await Promise.resolve();
    jest.advanceTimersByTime(SUBMIT_TIMEOUT_MS - 1);
    await Promise.resolve();
    jest.advanceTimersByTime(1);
    const error = await settled;
    expect(error).toBeInstanceOf(ListFormError);
    expect(error).toMatchObject({ kind: 'timeout', message: SUBMIT_TIMEOUT_MESSAGE });
  });

  it('resolves when the work finishes first', async () => {
    const pending = withTimeout(Promise.resolve('ok'), SUBMIT_TIMEOUT_MS);
    await Promise.resolve();
    jest.advanceTimersByTime(SUBMIT_TIMEOUT_MS);
    await expect(pending).resolves.toBe('ok');
  });
});
