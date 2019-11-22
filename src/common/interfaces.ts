// Огромная благодарность за этот тип автору статьи:
// https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
/**
 * Представляет собой объект со свойствами объекта `T`, которые наследуют `C`
 */
export type SubType<T, C> = Pick<T, {
	[K in keyof T]: T[K] extends C ? K : never
}[keyof T]>;
