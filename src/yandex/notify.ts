import { getInternalAPI } from "@yandex/internalAPI";

/**
 * Возвращает интерфейс уведомлений над плеером
 *
 * @returns Интерфейс подсказок над плеером
 */
function getNotify() {
	return getInternalAPI().blocks.get("notify");
}

/**
 * Отображает подсказку с текстом над плеером на короткое время
 *
 * @param text Текст в подсказке
 */
export function showNotify(text: string) {
	getNotify().show(text);
}

/**
 * Отображает подсказку с собственным HTML над плеером на короткое время
 *
 * @param html HTML для встраивания в подсказку
 * @param noClose Следует ли скрыть кнопку "Закрыть"
 */
export function showNotifyHTML(html: string, noClose?: boolean) {
	const { instance } = getNotify();

	instance.addMessage(html, noClose);
}
