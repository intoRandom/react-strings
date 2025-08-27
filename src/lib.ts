import type {
	AccessorString,
	AccessorArray,
	Vars,
	StringsConfig,
	NormalizedStrings,
} from './types';

export function makeAccessorString<T extends object>(
	objKeys: T,
	objValues: any,
	path = ''
): AccessorString<T> {
	const result: any = {};

	const interpolate = (tpl: string, vars?: Vars) =>
		tpl.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_m, p) =>
			vars?.[p] == null ? '' : String(vars[p])
		);

	for (const key in objKeys as any) {
		const currentPath = path ? `${path}.${key}` : key;
		const valKeys = (objKeys as any)[key];
		const valValues = objValues?.[key];

		if (valValues === undefined) {
			if (valKeys && typeof valKeys === 'object' && !Array.isArray(valKeys)) {
				result[key] = makeAccessorString(valKeys, {}, currentPath);
			} else {
				if (
					process.env.NODE_ENV === 'production' &&
					typeof valKeys === 'string'
				) {
					const tpl = valKeys;
					result[key] = (repl?: Vars) =>
						tpl.includes('{{') ? interpolate(tpl, repl) : tpl;
				} else {
					result[key] = () => currentPath;
				}
			}
		} else if (typeof valValues === 'string') {
			const tpl = valValues;
			result[key] = (repl?: Vars) =>
				tpl.includes('{{') ? interpolate(tpl, repl) : tpl;
		} else if (
			typeof valValues === 'number' ||
			typeof valValues === 'boolean' ||
			valValues === null
		) {
			const v = String(valValues);
			result[key] = () => v;
		} else if (Array.isArray(valValues)) {
			result[key] = () => currentPath;
		} else if (typeof valValues === 'object') {
			result[key] = makeAccessorString(valKeys, valValues, currentPath);
		} else {
			result[key] = () => currentPath;
		}
	}

	return result as AccessorString<T>;
}

export function makeAccessorArray<T extends object>(
	objKeys: T,
	objValues: any,
	path = ''
): AccessorArray<T> {
	const result: any = {};

	for (const key in objKeys) {
		const currentPath = path ? `${path}.${key}` : key;
		const valKeys = objKeys[key];
		const valValues = objValues?.[key];

		if (Array.isArray(valKeys)) {
			if (Array.isArray(valValues)) {
				result[key] = valValues;
			} else {
				if (process.env.NODE_ENV === 'production') {
					result[key] = valKeys;
				} else {
					result[key] = [];
				}
			}
		} else if (typeof valKeys === 'object' && valKeys !== null) {
			result[key] = makeAccessorArray(valKeys as any, valValues, currentPath);
		} else {
			result[key] = [];
		}
	}

	return result;
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
