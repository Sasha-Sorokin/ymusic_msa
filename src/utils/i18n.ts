import { getInternalAPI } from "@yandex/internalAPI";
import { Locales, ILocale } from "@locales";

declare global {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		i18nTranslate(keyset: string, key: string): string;
	}
}

interface IPlaceholdersMap {
	[placeholder: string]: string | number;
}

let detectedLocale = "en-GB"; // По-умолчанию Английская локаль

/**
 * Преобразует локаль формата приложения Яндекс.Музыки в наш
 *
 * @param yLocale Локаль формата приложения Яндекс.Музыки
 * @returns Наша максимальная подходящая локаль
 */
function convertYLocale(yLocale: string) {
	switch (yLocale) {
		case "ru":
		case "kk":
			return "ru-RU";
		default:
			return "en-GB";
	}
}

/**
 * Запрашивает строку прямо из локали приложения Яндекс.Музыки
 *
 * @param keyset К какому набору ключей принадлежит эта строка
 * @param key Строка для которой необходимо получить перевод
 * @returns Возвращает либо саму строку, либо перевод для неё
 */
export function getAppString(keyset: string, key: string) {
	return unsafeWindow.i18nTranslate(keyset, key);
}

/**
 * Пытается опознать используемую пользователем локаль
 *
 * @throws {Error} Если не удаётся прочитать настройку приложения Яндекс.Музыки
 */
export function tryDetectLocale() {
	const yLocale = getInternalAPI().settings?.lang;

	if (yLocale == null) throw new Error("Failed to detect locale.");

	detectedLocale = convertYLocale(yLocale);
}

/**
 * Получает карту строк для текущей используемой локали
 *
 * @returns Карта всех строк для текущей локали
 */
export function getStringsMap(): ILocale {
	if (detectedLocale == null) {
		throw new Error("Current locale is not detected.");
	}

	const locale = Locales[detectedLocale];

	if (locale == null) {
		throw new Error(`Locale "${detectedLocale}" is not defined.`);
	}

	return locale;
}

/**
 * Заменяет все заполнители предоставлеными данными
 *
 * @param str Строка, в которой осуществляется замена
 * @param placeholders Хэш-карта заполнителей и их значений
 * @returns Строка с заменёнными заполнителями
 */
export function formatString(str: string, placeholders: IPlaceholdersMap) {
	if (placeholders != null) {
		for (const placeholder of Object.keys(placeholders)) {
			str = str.replace(
				`${placeholder}`,
				`${placeholders[placeholder]}`,
			);
		}
	}

	return str;
}
