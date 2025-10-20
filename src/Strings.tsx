'use client';

import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';

import { TransitionComponent } from './Transition';

import {
	getLanguageFromConfig,
	makeAccessorArray,
	makeAccessorString,
	normalizeConfig,
} from './lib';

import { DEFAULT_BGCOLOR, DEFAULT_DURATION } from './types';
import type {
	StringsContext,
	StringsConfig,
	LanguageInfo,
	DefaultStrings,
} from './types';

export function createStrings<
	S extends Record<string, DefaultStrings<any>>,
	D extends Record<string, any> = S[keyof S]['data'] extends Record<string, any>
		? S[keyof S]['data']
		: Record<string, any>,
	L extends Record<string, LanguageInfo> = Record<string, LanguageInfo>
>(stringsConfig: StringsConfig<D, S, L>) {
	const {
		strings,
		browser = false,
		storage = false,
		bgColor = DEFAULT_BGCOLOR,
		duration = DEFAULT_DURATION,
	} = stringsConfig;

	const stringsKey = Object.keys(strings)[0];
	const stringsData = strings[stringsKey].data;

	const normalized = normalizeConfig(stringsConfig);

	const getLocale = () => {
		return getLanguageFromConfig(normalized, stringsKey, storage, browser);
	};

	const defaultStringsContext: StringsContext<D> = {
		language: stringsKey,
		setLanguage: () => {},
		Str: {} as ReturnType<typeof makeAccessorString<D>>,
		Arr: [] as ReturnType<typeof makeAccessorArray<D>>,
	};

	const StringsContext = createContext<StringsContext<D>>(
		defaultStringsContext
	);

	/* Provider */

	const StringsProvider = ({
		children,
		locale,
	}: {
		children: ReactNode;
		/* locale?: keyof S | keyof L; */
		locale?: string;
	}) => {
		const validLocale = locale && locale in normalized ? locale : stringsKey;

		const [language, setLanguage] = useState<string>(validLocale);

		const [translation, setTranslation] = useState<D | undefined>(
			normalized[validLocale]?.data
		);

		const [contentDir, setContentDir] = useState<'ltr' | 'rtl' | undefined>(
			normalized[validLocale]?.direction
		);

		const [isReady, setIsReady] = useState<boolean>(false);

		useEffect(() => {
			if (locale) return;

			const loadConfig = () => {
				const configLang = getLanguageFromConfig(
					normalized,
					stringsKey,
					storage,
					browser
				);

				if (configLang !== language) {
					setLanguage(configLang);
					document.documentElement.lang = configLang;
				}
			};

			loadConfig();
		}, []);

		useEffect(() => {
			let cancelled = false;

			const lang = normalized[language];
			if (!lang) {
				console.error(`Language "${language}" not found in normalized`);
				return;
			}

			if (lang.data) {
				setTranslation(lang.data);
				setContentDir(lang.direction);
				setIsReady(true);
				return;
			}

			const loadLanguage = async () => {
				if (!lang.loader) {
					console.warn(`No data or loader for "${language}"`);
					return;
				}

				try {
					const module = await lang.loader();
					const loadedData = module.default || module;

					if (!cancelled) {
						normalized[language] = { ...lang, data: loadedData };
						setTranslation(loadedData);
						setContentDir(lang.direction);
						setTimeout(() => setIsReady(true), duration);
					}
				} catch (error) {
					console.error(`Failed to load "${language}"`, error);
				}
			};

			loadLanguage();
			return () => {
				cancelled = true;
			};
		}, [language]);

		const changeLanguage = useCallback(
			async (newLang: string) => {
				const lang = normalized[newLang];
				if (!lang) {
					console.error(`Language: ${newLang} was not found in config file`);
					return;
				}

				if (language === newLang) return;

				if (!locale) {
					setIsReady(false);
					setLanguage(newLang);
					document.documentElement.lang = newLang;
				}

				if (storage) {
					try {
						localStorage.setItem('lang', newLang);
					} catch {
						console.warn('Could not save language preference');
					}
				}
			},
			[language, storage, normalized]
		);

		const getString = useCallback(() => {
			return makeAccessorString(stringsData, translation);
		}, [stringsData, translation]);

		const getArray = useCallback(() => {
			return makeAccessorArray(stringsData, translation);
		}, [stringsData, translation]);

		const langContextValue = useMemo<StringsContext<D>>(
			() => ({
				language,
				setLanguage: changeLanguage,
				Str: getString(),
				Arr: getArray(),
			}),
			[language, changeLanguage, getString, getArray]
		);

		return (
			<StringsContext.Provider value={langContextValue}>
				<TransitionComponent
					bgColor={bgColor}
					duration={duration}
					direction={contentDir}
					isReady={isReady}
				>
					{children}
				</TransitionComponent>
			</StringsContext.Provider>
		);
	};

	const useStrings = () => {
		const context = useContext(StringsContext);

		if (!context) {
			console.warn(
				'useStrings must be used within a <StringsProvider>. ' +
					'Did you forget to wrap your component?'
			);
			return defaultStringsContext;
		} else {
			return context;
		}
	};

	return { useStrings, StringsProvider, getLocale };
}
