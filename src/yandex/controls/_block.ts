declare global {
	interface IBlock {
		toggleDisabled(state: boolean): void;
	}

	interface IBlockOptions {
		type: string;
		data: unknown;
	}

	interface IYandexMusicBlocks {
		createBlock(creationOptions: IBlockOptions, container: HTMLElement): IBlock;
	}

	interface IYandexMusicAPI {
		blocks: IYandexMusicBlocks;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		Mu: IYandexMusicAPI;
	}
}

/**
 * Создаёт новый интерактивный элемент
 *
 * @param creationOptions Опции для создания элемента
 * @param container Контейнер, содержащий компоненты элемента
 * @returns Инициализированный интерактивный элемент
 */
export function createBlock(creationOptions: IBlockOptions, container: HTMLElement) {
	return unsafeWindow.Mu.blocks.createBlock(creationOptions, container);
}
