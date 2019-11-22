import { SubType } from "@common/interfaces";

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

	/**
	 * Представляет собой класс плеера
	 */
	interface IYandexMusicPlayer {
		/**
		 * Загрузился ли плеер
		 */
		isReady(): boolean;
	}

	/**
	 * Представляет собой хэш-карту, репозиторий загруженных классов
	 */
	interface IYandexMusicDiRepo {
		/**
		 * Инстанс плеерам
		 */
		player: IYandexMusicPlayer;
		/**
		 * Адаптер уведомлений
		 */
		adapter: IYandexMusicAdapter;
	}

	interface IYandexMusicDi {
		/**
		 * Хэш-карта, репозиторий загруженных классов
		 */
		repo: IYandexMusicDiRepo;
	}

	/**
	 * Представляет собой класс интерактивных уведомлений
	 */
	interface IYandexMusicNotify {
		/**
		 * Отображает новое уведомление над плеером на короткое время
		 *
		 * @param text Текст для отображения в уведомлении
		 */
		show(text: string): void;
	}

	// Просто отличительный от обычного объекта интерфейс
	interface IYandexMusicBlock {
		domDelegate(): void;
	}

	/**
	 * Опции для создания нового элемента
	 */
	interface IYandexBlockOptions<K extends string> {
		/**
		 * Тип элемента
		 */
		type: K;
		/**
		 * Дополнительные данные, необходимые для создания элемента
		 */
		data: unknown;
	}

	/**
	 * Представляет собой субтип всех элементов, которые возможно сконструировать,
	 * используя метод `IYandexMusicBlocks#createBlock`
	 */
	type YandexMusicBlockCostructors = SubType<IYandexMusicBlocks["blocks"], () => IYandexMusicBlock>;

	/**
	 * Представляет собой коллекцию интерактивных элементов
	 */
	interface IYandexMusicBlocks {
		di: IYandexMusicDi;
		/**
		 * Хэш-карта всех возможных элементов
		 */
		blocks: {
			/**
			 * Класс уведомлений над проигрывателем
			 */
			notify: IYandexMusicNotify;
			/**
			 * Класс селектора
			 */
			"d-select"(): IYandexMusicBlock;
		};

		/**
		 * Возвращает элемент под указанным названием
		 *
		 * @param name Название элемента
		 * @returns Элемент под указанным названием
		 */
		get<K extends keyof IYandexMusicBlocks["blocks"]>(name: K): IYandexMusicBlocks["blocks"][K];

		/**
		 * Создаёт новый интерактивный элемент
		 *
		 * @param creationOptions Опции для создания нового интерактивного элемента
		 * @param container Контейнер элементов для этого интерактивного элемента
		 * @returns Созданный интерактивный элемент
		 */
		createBlock<K extends keyof YandexMusicBlockCostructors>(
			creationOptions: IYandexBlockOptions<K>,
			container: HTMLElement,
		): ReturnType<YandexMusicBlockCostructors[K]>;
	}

	/**
	 * Представляет собой настройки пользователя
	 */
	interface IYandexSettings {
		/**
		 * Установленный пользователем язык
		 */
		lang: string;
	}

	/**
	 * Представляет собой основное внутреннее API Яндекс.Музыки
	 */
	interface IYandexMusicAPI {
		Adapter: IYandexMusicAdapterStatic;
		/**
		 * Коллекция интерактивных элементов
		 */
		blocks: IYandexMusicBlocks;
		/**
		 * Настройки пользователя
		 */
		settings: IYandexSettings;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		/**
		 * Основное внутреннее API Яндекс.Музыки
		 */
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
