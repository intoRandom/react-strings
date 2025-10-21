import React from 'react';
import type {
	AccessorString,
	AccessorArray,
	Vars,
	StringsConfig,
	NormalizedStrings,
} from './types';

const isObject = (val: any): val is object =>
	typeof val === 'object' && val !== null && !Array.isArray(val);

const buildPath = (parentPath: string, key: string): string =>
	parentPath ? `${parentPath}.${key}` : key;

const isProd = () => process.env.NODE_ENV === 'production';

const TAGS: Record<string, keyof React.JSX.IntrinsicElements> = {
	b: 'b',
	i: 'i',
	u: 'u',
	small: 'small',
	sup: 'sup',
	sub: 'sub',
};

export function interpolate(text: string, vars?: Vars) {
	return text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, p) =>
		vars?.[p] == null ? '' : String(vars[p])
	);
}

export function parseTags(text: string): React.JSX.Element | string {
	const regex = /\{(\w+)\{(.*?)\}\}/g;
	const parts: any[] = [];
	let lastIndex = 0;
	let match: RegExpExecArray | null;

	while ((match = regex.exec(text)) !== null) {
		const [full, tag, inner] = match;
		const before = text.slice(lastIndex, match.index);
		if (before) parts.push(before);

		const Tag = TAGS[tag];
		const parsedInner = parseTags(inner);

		if (Tag) {
			parts.push(React.createElement(Tag, { key: parts.length }, parsedInner));
		} else {
			parts.push(full);
		}

		lastIndex = match.index + full.length;
	}

	if (lastIndex < text.length) parts.push(text.slice(lastIndex));

	if (parts.length === 1) return parts[0];

	return React.createElement(React.Fragment, null, ...parts);
}

export function makeAccessorString<T extends object>(
	objKeys: T,
	objValues: any,
	path = ''
): AccessorString<T> {
	const result: any = {};

	for (const key in objKeys) {
		if (!Object.prototype.hasOwnProperty.call(objKeys, key)) continue;

		const currentPath = buildPath(path, key);
		const valKey = objKeys[key];
		const valValue = objValues?.[key];

		result[key] = processStringValue(valKey, valValue, currentPath);
	}
	return result as AccessorString<T>;
}

function processStringValue(valKey: any, valValue: any, path: string): any {
	if (typeof valKey === 'string') {
		if (typeof valValue !== 'string') {
			if (!isProd()) {
				return () => path;
			}

			const hasVars = /\{\{.*?\}\}/.test(valKey);
			const hasTags = /\{(\w+)\{.*?\}\}/.test(valKey);

			return (vars?: Vars) => {
				let text = valKey;
				if (hasVars) text = interpolate(text, vars);
				if (hasTags) return parseTags(text);
				return text;
			};
		}

		const hasVars = /\{\{.*?\}\}/.test(valValue);
		const hasTags = /\{(\w+)\{.*?\}\}/.test(valValue);

		return (vars?: Vars) => {
			let text = valValue;
			if (hasVars) text = interpolate(text, vars);
			if (hasTags) return parseTags(text);
			return text;
		};
	}

	if (isObject(valValue)) return makeAccessorString(valKey, valValue, path);

	if (isObject(valKey)) return makeAccessorString(valKey, {}, path);
	return () => path;
}

export function makeAccessorArray<T extends object>(
	objKeys: T,
	objValues: any,
	path = ''
): AccessorArray<T> {
	const result = {} as AccessorArray<T>;

	for (const key in objKeys) {
		if (!Object.prototype.hasOwnProperty.call(objKeys, key)) continue;

		const currentPath = buildPath(path, key);
		const valKey = objKeys[key];
		const valValue = objValues?.[key];

		result[key] = processArrayValue(valKey, valValue, currentPath) as any;
	}

	return result;
}

function processArrayValue(valKey: any, valValue: any, path: string) {
	if (Array.isArray(valKey)) {
		if (!Array.isArray(valValue)) {
			if (!isProd()) {
				console.warn(`[react-strings] Missing array at: ${path}`);
				return [];
			}
			return valKey.map((v: any, i) => {
				if (typeof v === 'string') {
					const hasTags = /\{(\w+)\{.*?\}\}/.test(v);
					return hasTags ? parseTags(v) : v;
				}
				if (isObject(v)) {
					return makeAccessorArray(v, {}, buildPath(path, String(i)));
				}
				return v;
			});
		}

		return valKey.map((v: any, i) => {
			const value = valValue[i];
			if (typeof v === 'string') {
				const hasTags = /\{(\w+)\{.*?\}\}/.test(v);
				return hasTags ? parseTags(v) : value ?? v;
			}
			if (isObject(v)) {
				return makeAccessorArray(v, value, buildPath(path, String(i)));
			}
			return value ?? v;
		});
	}

	if (isObject(valKey)) return makeAccessorArray(valKey, valValue, path);

	return [];
}

export function getBrowserLanguage(
	supportedLanguages: string[],
	fallback: string
): string {
	if (typeof navigator === 'undefined') return fallback;

	const browserLangs = navigator.languages || [navigator.language];

	for (const lang of browserLangs) {
		if (supportedLanguages.includes(lang)) {
			return lang;
		}

		const baseLang = lang.split('-')[0];
		if (supportedLanguages.includes(baseLang)) {
			return baseLang;
		}
	}

	return fallback;
}

export function normalizeConfig<T extends Record<string, any>>(
	stringsConfig: StringsConfig<T>
): Record<string, NormalizedStrings<T>> {
	const normalized: Record<string, NormalizedStrings<T>> = {};

	const [firstKey, firstValue] = Object.entries(stringsConfig.strings)[0] ?? [];
	if (firstKey && firstValue) {
		normalized[firstKey] = {
			data: firstValue.data,
			direction: firstValue.direction,
		};
	}

	if (stringsConfig.languages) {
		for (const [key, langInfo] of Object.entries(stringsConfig.languages)) {
			if (normalized[key]) {
				continue;
			}
			normalized[key] = {
				loader: langInfo.loader,
				direction: langInfo.direction,
			};
		}
	}

	return normalized;
}

export function getLanguageFromConfig(
	normalized: Record<string, any>,
	stringsKey: string,
	storage: boolean,
	browser: boolean
): string {
	let configLang = stringsKey;

	if (storage) {
		try {
			const savedLang = localStorage.getItem('lang');
			if (savedLang && normalized[savedLang]) {
				return savedLang;
			} else {
				if (browser) {
					configLang = getBrowserLanguage(Object.keys(normalized), configLang);
				}
				localStorage.setItem('lang', configLang);
				return configLang;
			}
		} catch {
			console.warn(
				'localStorage not available, using default language:',
				stringsKey
			);
			return stringsKey;
		}
	} else if (browser) {
		return getBrowserLanguage(Object.keys(normalized), configLang);
	}

	return configLang;
}
