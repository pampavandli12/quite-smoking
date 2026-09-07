import {
  appSymbolCatalog,
  appSymbolSource,
  resolveAppSymbol,
} from '@/components/AppSymbol';
import { isValidElement } from 'react';

describe('AppSymbol', () => {
  it('maps every semantic symbol to iOS and fallback names', () => {
    for (const definition of Object.values(appSymbolCatalog)) {
      expect(definition.sf).toBeTruthy();
      expect(definition.fallback).toBeTruthy();
    }
  });

  it('selects filled variants when they exist', () => {
    expect(resolveAppSymbol('home', true)).toEqual({
      sf: 'house.fill',
      fallback: 'home',
    });
    expect(resolveAppSymbol('lifebuoy', true)).toEqual(
      resolveAppSymbol('lifebuoy'),
    );
  });

  it('forwards Paper-provided size and color', () => {
    const source = appSymbolSource('leaf');
    expect(typeof source).toBe('function');
    if (typeof source !== 'function') {
      throw new Error('Expected a render function');
    }
    const element = source({ size: 31, color: '#123456' });
    expect(isValidElement(element)).toBe(true);
    if (!isValidElement(element)) {
      throw new Error('Expected a React element');
    }
    expect(element.props).toMatchObject({
      color: '#123456',
      name: 'leaf',
      size: 31,
    });
  });
});
