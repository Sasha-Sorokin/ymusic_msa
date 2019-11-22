import { getMu } from "./repo";

/**
 * Отображает подсказку с текстом
 *
 * @param text Текст в подсказке
 */
export function showNotify(text: string) {
	const { notify } = getMu().blocks.blocks;

	notify.show(text);
}
