import type {
	AccessorString,
	AccessorArray,
	Vars,
	StringsConfig,
	NormalizedStrings,
} from './types';

// ============ SHARED HELPERS ============
const isObject = (val: any): val is object =>
	typeof val === 'object' && val !== null && !Array.isArray(val);

const buildPath = (parentPath: string, key: string): string =>
	parentPath ? `${parentPath}.${key}` : key;

const isProd = () => process.env.NODE_ENV === 'production';

// Para makeAccessorString
const interpolate = (tpl: string, vars?: Vars) =>
	tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, p) =>
		vars?.[p] == null ? '' : String(vars[p])
	);

const createAccessor = (value: string) =>
	value.includes('{{')
		? (vars?: Vars) => interpolate(value, vars)
		: () => value;

// ============ ACCESSOR STRING ============
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
	if (valValue !== undefined) {
		if (typeof valValue === 'string') return createAccessor(valValue);
		if (isObject(valValue)) return makeAccessorString(valKey, valValue, path);
		if (['number', 'boolean'].includes(typeof valValue) || valValue === null) {
			return () => String(valValue);
		}
		return () => path;
	}

	if (isObject(valKey)) return makeAccessorString(valKey, {}, path);
	if (isProd() && typeof valKey === 'string') return createAccessor(valKey);

	return () => path;
}

// ============ ACCESSOR ARRAY ============
export function makeAccessorArray<T extends object>(
	objKeys: T,
	objValues: any,
	path = ''
): AccessorArray<T> {
	const result: any = {};

	for (const key in objKeys) {
		if (!Object.prototype.hasOwnProperty.call(objKeys, key)) continue;

		const currentPath = buildPath(path, key);
		const valKey = objKeys[key];
		const valValue = objValues?.[key];

		result[key] = processArrayValue(valKey, valValue, currentPath);
	}

	return result;
}

function processArrayValue(valKey: any, valValue: any, path: string): any {
	if (Array.isArray(valKey)) {
		if (Array.isArray(valValue)) return valValue;
		return isProd() ? valKey : [];
	}

	if (isObject(valKey)) {
		return makeAccessorArray(valKey, valValue, path);
	}

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
