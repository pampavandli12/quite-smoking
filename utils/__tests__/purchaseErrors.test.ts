import {
  getErrorMessage,
  isUserCancelledPurchaseError,
} from '../purchaseErrors';

describe('purchase error narrowing', () => {
  test('detects RevenueCat-style cancellation objects', () => {
    expect(isUserCancelledPurchaseError({ userCancelled: true })).toBe(true);
    expect(isUserCancelledPurchaseError({ userCancelled: false })).toBe(false);
    expect(isUserCancelledPurchaseError(new Error('failed'))).toBe(false);
    expect(isUserCancelledPurchaseError(null)).toBe(false);
  });

  test('reads only string error messages', () => {
    expect(getErrorMessage(new Error('native store unavailable'))).toBe(
      'native store unavailable',
    );
    expect(getErrorMessage({ message: 42 })).toBe('');
    expect(getErrorMessage('failure')).toBe('');
  });
});
