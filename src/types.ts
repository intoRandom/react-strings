import React from 'react';
import { makeAccessorArray, makeAccessorString } from './lib';

/* Configuration */

type TextDirection = 'ltr' | 'rtl';

export type DefaultStrings<
	D extends Record<string, any> = Record<string, any>
> = {
	data: D;
	direction?: TextDirection;
};

export type LanguageInfo = {
	loader: () => Promise<any>;
	direction?: TextDirection;
};

export type StringsConfig<
	D extends Record<string, any> = Record<string, any>,
	S extends Record<string, DefaultStrings<D>> = Record<
		string,
		DefaultStrings<D>
	>,
	L extends Record<string, LanguageInfo> = Record<string, LanguageInfo>
> = {
	strings: S;
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

export type Vars = Record<string, any>;

type LeafFn = (repl?: Vars) => string | React.JSX.Element;

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

export type AccessorArray<T> = {
	[K in keyof T]: T[K] extends any[]
		? T[K] extends object[]
			? AccessorArray<T[K][number]>[]
			: (string | React.JSX.Element)[]
		: T[K] extends object
		? AccessorArray<T[K]>
		: string | React.JSX.Element;
};

/* CONST */
export const DEFAULT_DURATION = 200;
export const DEFAULT_BGCOLOR = 'black';

/* 

caso 1: array de strings
{
	arrStr:["solo string", "string y {b{etiqueta}}"]
}// el output debera ser (string | jsx)[]

caso 2: array de objetos
{
	arrObj:[
		{val1:"hola" val2:["hola", "{b{mundo}}"]},
		{val1:"hello" val2:["hello", "{b{world}}"]},
	]
} el output debera ser {val1:string|jsx,val2:(string|jsx)[]}[]
*/
