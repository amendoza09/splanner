import axios from 'axios';
import {
  addChore,
  addEventToUser,
  deleteChore,
  deleteEvent,
  deleteUser,
  getChores,
  getGroupByCode,
  toggleChore,
  updateEvent,
} from './api';

jest.mock('axios', () => {
  const instance = { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() };
  return { __esModule: true, default: { create: () => instance, get: jest.fn() } };
});

const http = axios.create();
const CODE = 'ABCDE';
const withCode = { params: { group_code: CODE } };

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getGroupByCode', () => {
  test('returns the members on success', async () => {
    http.get.mockResolvedValue({ status: 200, data: { users: [{ user_id: 1 }] } });
    await expect(getGroupByCode(CODE)).resolves.toEqual({ status: 200, users: [{ user_id: 1 }] });
    expect(http.get).toHaveBeenCalledWith(`/group/${CODE}`);
  });

  // A kiosk logs out on a non-retryable failure and keeps waiting on a
  // retryable one, so a server blip must never look like a deleted group.
  test('does not retry a group that is really gone', async () => {
    http.get.mockRejectedValue({ response: { status: 404 } });
    await expect(getGroupByCode(CODE)).resolves.toEqual({ status: 404, retryable: false });
  });

  test('retries when the server errors', async () => {
    http.get.mockRejectedValue({ response: { status: 503 } });
    await expect(getGroupByCode(CODE)).resolves.toEqual({ status: 503, retryable: true });
  });

  test('retries when the network is down', async () => {
    http.get.mockRejectedValue(new Error('Network Error'));
    await expect(getGroupByCode(CODE)).resolves.toEqual({ status: undefined, retryable: true });
  });
});

describe('requests match the backend routes', () => {
  const event = { title: 'Dentist' };

  test.each([
    ['addEventToUser', () => addEventToUser(CODE, 1, event), 'post', ['/members/1/events', event, withCode]],
    ['updateEvent', () => updateEvent(CODE, 1, 2, event), 'patch', ['/members/1/events/2', event, withCode]],
    ['deleteEvent', () => deleteEvent(CODE, 1, 2), 'delete', ['/members/1/events/2', withCode]],
    ['deleteUser', () => deleteUser(CODE, 1), 'delete', ['/members/1', withCode]],
    ['addChore', () => addChore(CODE, event), 'post', [`/group/${CODE}/chores`, event]],
    ['toggleChore', () => toggleChore(CODE, 3, true), 'patch', ['/chores/3', { completed: true }, withCode]],
    ['deleteChore', () => deleteChore(CODE, 3), 'delete', ['/chores/3', withCode]],
  ])('%s', async (_name, call, method, expectedArgs) => {
    http[method].mockResolvedValue({ data: 'ok' });
    await expect(call()).resolves.toBe('ok');
    expect(http[method]).toHaveBeenCalledWith(...expectedArgs);
  });
});

describe('failures reach the UI correctly', () => {
  test('a failed change rejects so the screen can show an error', async () => {
    http.delete.mockRejectedValue(new Error('nope'));
    await expect(deleteEvent(CODE, 1, 2)).rejects.toThrow('nope');
  });

  test('a failed chore fetch returns null so the list on screen is kept', async () => {
    http.get.mockRejectedValue(new Error('nope'));
    await expect(getChores(CODE)).resolves.toBeNull();
  });
});
