import preventDefault from './preventDefault';

// These tests are of questionable usefulness

it('Calls preventDefault if it exists', () => {
    const e = { preventDefault: jest.fn() };
    // tslint:disable-next-line no-any
    preventDefault(e as any);
    expect(e.preventDefault).toHaveBeenCalled();
});

it('Sets returnValue to false if preventDefault does not exist', () => {
    const e = { returnValue: true };
    // tslint:disable-next-line no-any
    preventDefault(e as any);
    expect(e.returnValue).toBe(false);
});