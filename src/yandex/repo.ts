declare global {
	interface IYandexMusicAdapter {
		on(event: string, callback: () => void): void;
	}

	interface IYandexMusicAdapterStatic {
		/**
		 * Остановка из-за долгого прослушивания
		 */
		CRACKDOWN_PAUSE: string;
	}

	interface IYandexMusicPlayer {
		isReady(): boolean;
	}

	interface IYandexMusicDiRepo {
		player: IYandexMusicPlayer;
		adapter: IYandexMusicAdapter;
	}

	interface IYandexMusicDi {
		repo: IYandexMusicDiRepo;
	}

	interface IYandexMusicNotify {
		show(text: string): void;
	}

	interface IYandexMusicBlocks {
		di: IYandexMusicDi;
		blocks: {
			notify: IYandexMusicNotify;
		};
	}

	interface IYandexMusicAPI {
		Adapter: IYandexMusicAdapterStatic;
		blocks: IYandexMusicBlocks;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		Mu: IYandexMusicAPI;
	}
}

/**
 * Возвращает глобальный объект Mu
 *
 * @throws {Error} Если объект Mu не объявлен
 * @returns Глобальный объект Mu
 */
export function getMu() {
	const mu = unsafeWindow.Mu;

	if (mu == null) {
		throw new Error("Mu is not available.");
	}

	return mu;
}

/**
 * Возвращает репозиторий общих модулей
 *
 * @throws {Error} Если репозиторий недоступен
 * @returns Репозиторий общих модулей
 */
export function exposeRepo() {
	const repo = unsafeWindow.Mu?.blocks?.di?.repo;

	if (repo == null) {
		throw new Error("Repo is not available.");
	}

	return repo;
}