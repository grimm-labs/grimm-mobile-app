import { waitWhilePending } from '@/lib/lightning/wait-for-payment';

type FakePayment = { id: string; status: 'Pending' | 'Completed' | 'Failed' };

/** A clock that only moves when the wait sleeps, so the tests control time exactly. */
function fakeClock() {
  let time = 0;
  return {
    now: () => time,
    sleep: jest.fn(async (ms: number) => {
      time += ms;
    }),
  };
}

const isPending = (payment: FakePayment) => payment.status === 'Pending';

describe('waitWhilePending', () => {
  it('returns a payment that is not Pending right away, without reading it again', async () => {
    const clock = fakeClock();
    const refresh = jest.fn();

    const payment = await waitWhilePending({ initial: { id: 'p1', status: 'Completed' as const }, isPending, refresh, ...clock });

    expect(payment.status).toBe('Completed');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('reads the payment again every second until it completes', async () => {
    const clock = fakeClock();
    const statuses: FakePayment['status'][] = ['Pending', 'Pending', 'Completed'];
    const refresh = jest.fn(async (payment: FakePayment) => ({ ...payment, status: statuses.shift()! }));

    const payment = await waitWhilePending<FakePayment>({ initial: { id: 'p1', status: 'Pending' }, isPending, refresh, ...clock });

    expect(payment).toEqual({ id: 'p1', status: 'Completed' });
    expect(refresh).toHaveBeenCalledTimes(3);
    expect(clock.sleep).toHaveBeenCalledWith(1_000);
    expect(clock.now()).toBe(3_000);
  });

  it('returns a Failed payment as soon as it is read', async () => {
    const clock = fakeClock();
    const refresh = jest.fn(async (payment: FakePayment) => ({ ...payment, status: 'Failed' as const }));

    const payment = await waitWhilePending<FakePayment>({ initial: { id: 'p1', status: 'Pending' }, isPending, refresh, ...clock });

    expect(payment.status).toBe('Failed');
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('gives up after 60 s and returns the payment still Pending', async () => {
    const clock = fakeClock();
    const refresh = jest.fn(async (payment: FakePayment) => payment);

    const payment = await waitWhilePending<FakePayment>({ initial: { id: 'p1', status: 'Pending' }, isPending, refresh, ...clock });

    expect(payment.status).toBe('Pending');
    expect(clock.now()).toBe(60_000);
    expect(refresh).toHaveBeenCalledTimes(60);
  });

  it('keeps the last known payment when a read fails, and goes on', async () => {
    const clock = fakeClock();
    const refresh = jest
      .fn<Promise<FakePayment>, [FakePayment]>()
      .mockRejectedValueOnce(new Error('network'))
      .mockImplementation(async (payment) => ({ ...payment, status: 'Completed' }));

    const payment = await waitWhilePending<FakePayment>({ initial: { id: 'p1', status: 'Pending' }, isPending, refresh, ...clock });

    expect(payment.status).toBe('Completed');
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
