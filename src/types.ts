import { makeAccessorArray, makeAccessorString } from './lib';

/* Configuration */

type TextDirection = 'ltr' | 'rtl';

type DefaultStrings<D extends Record<string, any> = Record<string, any>> = {
	key: string;
	data: D;
	direction?: TextDirection;
};

export type LanguageInfo = {
	loader: () => Promise<any>;
	direction?: TextDirection;
};

export type StringsConfig<
	D extends Record<string, any> = Record<string, any>,
	L extends Record<string, LanguageInfo> = Record<string, LanguageInfo>
> = {
	strings: DefaultStrings<D>;
	languages?: L;
	browser?: boolean;
	storage?: boolean;
	bgColor?: string;
	duration?: number;
};

/* Normalization */

export type NormalizedStrings<T extends Record<string, any>> = {
	data?: T;
	loader?: () => Promise<any>;
	direction?: TextDirection;
};

/* Context */

export type StringsContext<U extends object> = {
	language: string;
	setLanguage: (value: string) => void;
	Str: ReturnType<typeof makeAccessorString<U>>;
	Arr: ReturnType<typeof makeAccessorArray<U>>;
};

/* Accessors */

export type AccessorArray<T> = {
	[K in keyof T]: T[K] extends any[]
		? T[K]
		: T[K] extends object
		? AccessorArray<T[K]>
		: string[];
};

export type Vars = Record<string, any>;
type LeafFn = (repl?: Vars) => string;

type IsPlainObject<T> = T extends object
	? T extends any[]
		? false
		: true
	: false;

export type AccessorString<T> = {
	[K in keyof T]: IsPlainObject<T[K]> extends true
		? AccessorString<T[K]>
		: LeafFn;
};

/* CONST */
export const DEFAULT_DURATION = 200;
export const DEFAULT_BGCOLOR = 'white';
