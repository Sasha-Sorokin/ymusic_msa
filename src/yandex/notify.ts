import { getInternalAPI } from "./internalAPI";

/**
 * Отображает подсказку с текстом над плеером на короткое время
 *
 * @param text Текст в подсказке
 */
export function showNotify(text: string) {
	const { notify } = getInternalAPI().blocks.blocks;

	notify.show(text);
}
