import { getInternalAPI } from "./internalAPI";

/**
 * Отображает подсказку с текстом
 *
 * @param text Текст в подсказке
 */
export function showNotify(text: string) {
	const { notify } = getInternalAPI().blocks.blocks;

	notify.show(text);
}
