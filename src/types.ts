import { makeAccessorArray, makeAccessorString } from './lib';

export type StringsConfigType<T extends Record<string, any>> = {
	defaultLang: keyof T;
	mode: 'localStorage' | 'memory';
	bgColor?: string;
	duration?: number;
	languages: T;
};

export type StringsContextType<U extends object> = {
	language: string;
	setLanguage: (value: string) => void;
	Str: ReturnType<typeof makeAccessorString<U>>;
	Arr: ReturnType<typeof makeAccessorArray<U>>;
};

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
