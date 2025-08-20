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

import { flushSync } from 'react-dom';

import { makeAccessorArray, makeAccessorString } from './lib';

import { DEFAULT_BGCOLOR, DEFAULT_DURATION } from './types';
import type { StringsContextType, StringsConfigType } from './types';
import { TransitionComponent } from './Transition';

export function createStrings<T extends Record<string, any>>(
	stringsConfig: StringsConfigType<T>
) {
	const {
		defaultLang,
		languages,
		mode,
		bgColor = DEFAULT_BGCOLOR,
		duration = DEFAULT_DURATION,
	} = stringsConfig;

	const stringsDefault = languages[defaultLang];

	type DefaultKeys = T[typeof defaultLang];

	const defaultStringsContext: StringsContextType<DefaultKeys> = {
		language: '',
		setLanguage: () => {},
		Str: {} as ReturnType<typeof makeAccessorString<DefaultKeys>>,
		Arr: [] as ReturnType<typeof makeAccessorArray<DefaultKeys>>,
	};

	const StringsContext = createContext<StringsContextType<DefaultKeys>>(
		defaultStringsContext
	);

	const StringsProvider = ({ children }: { children: ReactNode }) => {
		const [language, setLanguage] = useState<string>(String(defaultLang));

		const [isReady, setIsReady] = useState<boolean>(false);

		const currentTranslations = useMemo(() => {
			return languages[language] || stringsDefault || {};
		}, [language, languages, defaultLang]);

		useEffect(() => {
			const loadConfig = () => {
				let configLang = String(defaultLang);

				if (mode === 'localStorage') {
					try {
						const savedLang = localStorage.getItem('lang');
						if (savedLang && languages[savedLang]) {
							configLang = savedLang;
						} else {
							localStorage.setItem('lang', String(configLang));
						}
					} catch {
						console.warn('localStorage not available, using default language:');
					}

					setLanguage(configLang);
				}
				document.documentElement.lang = configLang;

				setIsReady(true);
			};

			loadConfig();
		}, []);

		const changeLanguage = useCallback(
			(newLang: string) => {
				if (languages[newLang]) {
					if (language !== newLang) {
						flushSync(() => {
							setIsReady(false);
						});

						flushSync(() => {
							setLanguage(newLang);
							document.documentElement.lang = newLang;
							if (mode === 'localStorage') {
								try {
									localStorage.setItem('lang', newLang);
								} catch {
									console.warn('Could not save language preference');
								}
							}
						});

						setTimeout(() => {
							setIsReady(true);
						}, duration);
					}
				} else {
					console.error(`Language: ${newLang} was not found in config file`);
				}
			},
			[language, languages, mode, duration]
		);

		const getString = useCallback(() => {
			return makeAccessorString(stringsDefault, currentTranslations);
		}, [stringsDefault, currentTranslations]);

		const getArray = useCallback(() => {
			return makeAccessorArray(stringsDefault, currentTranslations);
		}, [stringsDefault, currentTranslations]);

		const langContextValue = useMemo<StringsContextType<DefaultKeys>>(
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
		}

		return context;
	};

	return { useStrings, StringsProvider };
}
