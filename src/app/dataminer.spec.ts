import {describe, it, expect, beforeEachProviders, inject} from 'angular2/testing';
import {DataminerApp} from '../app/dataminer';

beforeEachProviders(() => [DataminerApp]);

describe('App: Dataminer', () => {
  it('should have the `defaultMeaning` as 42', inject([DataminerApp], (app) => {
    expect(app.defaultMeaning).toBe(42);
  }));

  describe('#meaningOfLife', () => {
    it('should get the meaning of life', inject([DataminerApp], (app) => {
      expect(app.meaningOfLife()).toBe('The meaning of life is 42');
      expect(app.meaningOfLife(22)).toBe('The meaning of life is 22');
    }));
  });
});

