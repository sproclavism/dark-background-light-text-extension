import { parseCSSColor } from 'csscolorparser-ts';
import type { ConfiguredPages, Preferences, PrefsType } from './types';
import type { PrefsWithValues } from './shared';
import { strip_alpha } from './color_utils';
import { methods } from '../methods/methods';

export const SETTINGS_FILE_FORMAT = 'dark-background-light-text-settings';
export const SETTINGS_FILE_VERSION = 1;

export interface SettingsFile {
  format: typeof SETTINGS_FILE_FORMAT;
  version: number;
  exported_at: string;
  preferences: PrefsWithValues;
}

export interface ParsedSettings {
  preferences: PrefsWithValues;
  /** Keys present in the file that this version does not know about. */
  ignored_keys: string[];
}

export function serialize_settings(
  prefs: PrefsWithValues,
  date: Date = new Date(),
): string {
  const file: SettingsFile = {
    format: SETTINGS_FILE_FORMAT,
    version: SETTINGS_FILE_VERSION,
    exported_at: date.toISOString(),
    preferences: prefs,
  };
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function settings_file_name(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const stamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `dark-background-light-text-settings-${stamp}.json`;
}

function is_plain_object(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && Object.getPrototypeOf(value) === Object.prototype
  );
}

function validate_value(
  pref: Preferences[number],
  value: unknown,
): PrefsType | null {
  switch (pref.type) {
    case 'bool':
      return typeof value === 'boolean' ? value : null;
    case 'menulist':
      return Number.isInteger(value)
        && (value as number) >= 0
        && (value as number) < pref.options.length
        ? (value as number)
        : null;
    case 'color': {
      if (typeof value !== 'string') {
        return null;
      }
      const parsed = parseCSSColor(value);
      if (!parsed) {
        return null;
      }
      return `#${strip_alpha(parsed)
        .map((c) => c.toString(16).padStart(2, '0'))
        .join('')}`;
    }
    case 'configured_pages': {
      if (!is_plain_object(value)) {
        return null;
      }
      const result: ConfiguredPages = {};
      for (const [page, method] of Object.entries(value)) {
        if (
          !page.trim()
          || typeof method !== 'string'
          || !Object.prototype.hasOwnProperty.call(methods, method)
        ) {
          return null;
        }
        result[page] = method as ConfiguredPages[string];
      }
      return result;
    }
  }
}

/**
 * Parses and validates the contents of a settings file. Throws an Error with
 * a user-presentable message if the file is not acceptable; nothing is
 * returned partially, so a bad file never results in a half-applied import.
 */
export function parse_settings(
  text: string,
  preferences: Preferences,
): ParsedSettings {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('The file is not valid JSON.');
  }
  if (!is_plain_object(data) || data.format !== SETTINGS_FILE_FORMAT) {
    throw new Error(
      'The file does not look like a Dark Background and Light Text settings export.',
    );
  }
  if (
    typeof data.version !== 'number'
    || !Number.isInteger(data.version)
    || data.version < 1
  ) {
    throw new Error('The settings file has an invalid version.');
  }
  if (data.version > SETTINGS_FILE_VERSION) {
    throw new Error(
      'The settings file was created by a newer version of the extension.',
    );
  }
  if (!is_plain_object(data.preferences)) {
    throw new Error('The settings file does not contain any preferences.');
  }

  const result: PrefsWithValues = {};
  const ignored_keys: string[] = [];
  for (const [key, raw_value] of Object.entries(data.preferences)) {
    const pref = preferences.find((p) => p.name === key);
    if (!pref) {
      ignored_keys.push(key);
      continue;
    }
    const value = validate_value(pref, raw_value);
    if (value === null) {
      const title =
        pref.type === 'configured_pages' ? 'Configured pages' : pref.title;
      throw new Error(`The value for "${title}" is invalid.`);
    }
    result[key] = value;
  }
  return { preferences: result, ignored_keys };
}
