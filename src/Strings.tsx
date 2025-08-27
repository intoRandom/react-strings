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
		const [language, setLanguage] = useState<string>(
			locale ? String(locale) : ''
		);

		const [translation, setTranslation] = useState<D | undefined>(undefined);

		const [contentDir, setContentDir] = useState<'ltr' | 'rtl' | undefined>(
			undefined
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

				setLanguage(configLang);
				document.documentElement.lang = configLang;
			};

			loadConfig();
		}, []);

		useEffect(() => {
			if (language === '') return;

			let cancelled = false;

			const setLanguageData = (data: any, direction: any) => {
				if (!cancelled) {
					setTranslation(data);
					setContentDir(direction);
				}
			};
			const fallbackToDefault = () => {
				if (!cancelled) {
					const defaultLang = normalized[stringsKey];
					setLanguageData(defaultLang.data, defaultLang.direction);
				}
			};

			const loadLanguage = async () => {
				const lang = normalized[language];
				if (!lang) return;

				try {
					if (lang.data) {
						setLanguageData(lang.data, lang.direction);
					} else if (lang.loader) {
						const module = await lang.loader();
						const loadedData = module.default || module;

						normalized[language] = { ...lang, data: loadedData };
						setLanguageData(loadedData, lang.direction);
					} else {
						fallbackToDefault();
					}
				} catch (error) {
					console.error(
						`Failed to load language "${language}", falling back to default "${stringsKey}".`,
						error
					);
					fallbackToDefault();
				} finally {
					if (!cancelled) {
						setTimeout(() => setIsReady(true), duration);
					}
				}
			};

			loadLanguage();
			return () => {
				cancelled = true;
			};
		}, [language, normalized, duration]);

		const changeLanguage = useCallback(
			async (newLang: string) => {
				if (locale) return;

				if (language === newLang) return;

				const lang = normalized[newLang];
				if (!lang) {
					console.error(`Language: ${newLang} was not found in config file`);
					return;
				}

				setIsReady(false);
				setLanguage(newLang);
				document.documentElement.lang = newLang;
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
