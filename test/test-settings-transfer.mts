import { strict as assert } from 'assert';
import { describe, it } from 'mocha';
import { preferences, prefs_keys_with_defaults } from '../src/common/shared';
import type { PrefsWithValues } from '../src/common/shared';
import {
  parse_settings,
  serialize_settings,
  settings_file_name,
  SETTINGS_FILE_FORMAT,
  SETTINGS_FILE_VERSION,
} from '../src/common/settings-transfer';

function file_with(prefs: unknown, extra: object = {}): string {
  return JSON.stringify({
    format: SETTINGS_FILE_FORMAT,
    version: SETTINGS_FILE_VERSION,
    preferences: prefs,
    ...extra,
  });
}

describe('Settings import/export', () => {
  it('round-trips all preferences', () => {
    const prefs: PrefsWithValues = {
      ...prefs_keys_with_defaults,
      enabled: false,
      default_method: 2,
      default_foreground_color: '#abcdef',
      configured_pages: { 'example.com': '0', 'example.org': '3' },
    };
    const parsed = parse_settings(serialize_settings(prefs), preferences);
    assert.deepEqual(parsed.preferences, prefs);
    assert.deepEqual(parsed.ignored_keys, []);
  });

  it('exports every known preference', () => {
    const data = JSON.parse(serialize_settings(prefs_keys_with_defaults));
    assert.equal(data.format, SETTINGS_FILE_FORMAT);
    assert.equal(data.version, SETTINGS_FILE_VERSION);
    assert.deepEqual(
      Object.keys(data.preferences).sort(),
      preferences.map((p) => p.name).sort(),
    );
  });

  it('imports only the keys present and reports unknown ones', () => {
    const parsed = parse_settings(
      file_with({ enabled: false, something_else: 1 }),
      preferences,
    );
    assert.deepEqual(parsed.preferences, { enabled: false });
    assert.deepEqual(parsed.ignored_keys, ['something_else']);
  });

  it('normalizes colors to hex', () => {
    const parsed = parse_settings(
      file_with({ default_link_color: 'red' }),
      preferences,
    );
    assert.equal(parsed.preferences.default_link_color, '#ff0000');
  });

  const invalid: [string, string][] = [
    ['not JSON', '{'],
    [
      'wrong format',
      JSON.stringify({ format: 'x', version: 1, preferences: {} }),
    ],
    ['newer version', file_with({}, { version: SETTINGS_FILE_VERSION + 1 })],
    ['missing version', file_with({}, { version: undefined })],
    ['missing preferences', file_with(undefined)],
    ['non-boolean bool', file_with({ enabled: 'yes' })],
    ['out-of-range menulist', file_with({ default_method: 99 })],
    ['non-integer menulist', file_with({ default_method: 1.5 })],
    ['invalid color', file_with({ default_background_color: 'nope' })],
    ['configured_pages array', file_with({ configured_pages: [] })],
    [
      'configured_pages bad method',
      file_with({ configured_pages: { 'example.com': '42' } }),
    ],
    [
      'configured_pages empty url',
      file_with({ configured_pages: { ' ': '1' } }),
    ],
  ];
  for (const [name, text] of invalid) {
    it(`rejects ${name}`, () => {
      assert.throws(() => parse_settings(text, preferences));
    });
  }

  it('builds a dated file name', () => {
    assert.equal(
      settings_file_name(new Date(2026, 0, 5)),
      'dark-background-light-text-settings-2026-01-05.json',
    );
  });
});
