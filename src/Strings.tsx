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
	getBrowserLanguage,
	makeAccessorArray,
	makeAccessorString,
	normalizeConfig,
} from './lib';

import { DEFAULT_BGCOLOR, DEFAULT_DURATION } from './types';
import type { StringsContext, StringsConfig, LanguageInfo } from './types';

export function createStrings<
	D extends Record<string, any>,
	L extends Record<string, LanguageInfo>
>(stringsConfig: StringsConfig<D, L>) {
	const {
		strings,
		browser = false,
		storage = false,
		bgColor = DEFAULT_BGCOLOR,
		duration = DEFAULT_DURATION,
	} = stringsConfig;

	const { key: stringsKey, data: stringsData } = strings;

	const normalized = normalizeConfig(stringsConfig);

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
		locale?: typeof stringsKey;
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
				let configLang = stringsKey;

				if (storage) {
					try {
						const savedLang = localStorage.getItem('lang');
						if (savedLang && normalized[savedLang]) {
							configLang = savedLang;
						} else {
							if (browser) {
								configLang = getBrowserLanguage(
									Object.keys(normalized),
									configLang
								);
							}
							localStorage.setItem('lang', configLang);
						}
					} catch {
						console.warn(
							'localStorage not available, using default language:',
							stringsKey
						);
					}
				} else if (browser) {
					configLang = getBrowserLanguage(Object.keys(normalized), configLang);
				}

				setLanguage(configLang);
				document.documentElement.lang = configLang;
			};

			loadConfig();
		}, []);

		useEffect(() => {
			if (language === '') return;

			let cancelled = false;
			const loadLanguage = async () => {
				const lang = normalized[language];
				if (!lang) return;

				try {
					if (lang.data) {
						if (!cancelled) setTranslation(lang.data);
					} else if (lang.loader) {
						const module = await lang.loader();
						normalized[language] = {
							...lang,
							data: module.default || module,
						};
						if (!cancelled) {
							setTranslation(module.default || module);
							setContentDir(normalized[language].direction);
						}
					} else {
						if (!cancelled) {
							setTranslation(normalized[stringsKey].data);
						}
						setContentDir(normalized[stringsKey].direction);
					}
				} catch (error) {
					console.error(
						`Failed to load language "${language}", falling back to default "${stringsKey}".`,
						error
					);
					if (!cancelled) {
						setTranslation(normalized[stringsKey].data);
						setContentDir(normalized[stringsKey].direction);
					}
				} finally {
					if (!cancelled) {
						setTimeout(() => {
							setIsReady(true);
						}, duration);
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

	return { useStrings, StringsProvider };
}
