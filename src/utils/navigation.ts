import { Logger } from "@utils/logger";
import { getExternalAPI, PlayerEvent } from "src/yandex/externalAPI";
import { Event } from "./event";

/**
 * Перечисление событий, связанных с навигацией по страницам
 */
const enum PagesEvent {
	/**
	 * Событие происходящее после загрузки новой страницы
	 */
	Loaded = "loaded",
	/**
	 * Событие происходящее после выгрузки прошлой страницы
	 */
	Unloaded = "unloaded",
}

/**
 * Представляет собой общую информацию о странице
 */
interface IPagesData {
	/**
	 * Контейнер, в котором рендерится контент страницы
	 */
	container: Element;
	/**
	 * Внутреннее название страницы
	 */
	name: string;
	/**
	 * Название шаблона, используемого для рендера этой страницы
	 */
	templateName: string;
	/**
	 * Суб-категория страницы (например, вкладка)
	 */
	what: string;
	/**
	 * Дополнительные данные для создания страницы
	 */
	data: unknown;
}

/**
 * Представляет собой обработчик событий навигации
 */
type PagesCallback = (data: IPagesData) => void;

declare global {
	interface IYandexMusicAPI {
		pages: {
			on(event: PagesEvent, callback: PagesCallback): void;
			off(event: PagesEvent, callback: PagesCallback): void;
			current: IPagesData;
		};
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		Mu: IYandexMusicAPI;
	}
}

type OnNavigatedCallback = (data: IPagesData) => unknown;
type PathListener = (data: IPagesData) => unknown;

/**
 * Карта обработчиков навигации по определённым шаблонам
 */
const templateListeners = new Map<string, Set<PathListener>>();

const logger = new Logger("NavigationInterceptor");

const [navigated, triggerNavigated] = Event.create<null, OnNavigatedCallback>();
const [navigatedAway, triggerNavigatedAway] = Event.create<null, OnNavigatedCallback>();

/**
 * Событие, происходящее при навигации пользователем на другую страницу
 *
 * Срабатывает с данными о прошлой (выгруженной) страницы
 */
export const navigatedAwayEvent = navigatedAway;

/**
 * Событие, происходящее при навигации пользователем на новую страницу
 *
 * Срабатывает с данными о новой (загруженной) страницы
 */
export const navigatedEvent = navigated;

let loadedCallbackPushed = false;
let unloadedCallbackPushed = false;

/**
 * Возвращает текущий модуль страниц
 *
 * @throws {Error} Если модуль страниц недоступен
 * @returns Модуль страниц
 */
function getModule() {
	const module = unsafeWindow.Mu.pages;

	if (module == null) {
		throw new Error("Pages module is not available.");
	}

	return module;
}

/**
 * Вешает наш обработчик к модулю страниц, чтобы вызывать событие выгрузки
 */
function pushUnloadCallback() {
	if (unloadedCallbackPushed) {
		throw new Error("Pre-navigation callback is already pushed.");
	}

	getModule().on(PagesEvent.Unloaded, (data: IPagesData) => {
		triggerNavigatedAway(null, data);
	});

	unloadedCallbackPushed = true;
}

/**
 * Вызывает обработчики после перехода на новую страницу
 *
 * @param data Данные текущей страницы
 */
function postNavigation(data: IPagesData) {
	const { templateName } = data;

	if (templateName == null) {
		logger.trace("warn", "Called postNavigation with no path");

		return;
	}

	const listeners = templateListeners.get(templateName);

	if (listeners == null) return;

	for (const callback of listeners) callback(data);
}

/**
 * Вешает наш обработчик к модулю страниц, чтобы вызывать событие навигации
 */
function pushLoadedCallback() {
	if (loadedCallbackPushed) {
		throw new Error("Post-navigation callback is already pushed.");
	}

	getModule().on(PagesEvent.Loaded, (data: IPagesData) => {
		triggerNavigated(null, data);

		postNavigation(data);
	});

	loadedCallbackPushed = true;
}

/**
 * Вешает обработчик, срабатывающий при навигации на страницу с указанным шаблоном
 *
 * @param templateName Название шаблона для которого вызывается обработчик
 * @param callback Обработчик, вызываемый с данными новой страницы
 */
export function onNavigationTo(templateName: string, callback: PathListener) {
	let bindings = templateListeners.get(templateName);

	if (bindings == null) {
		bindings = new Set<PathListener>();

		templateListeners.set(templateName, bindings);
	}

	bindings.add(callback);
}

/**
 * Убирает обработчик события нафигации для страницы с указанным шаблоном
 *
 * @param path Название шаблона для которого вызывался обработчик
 * @param callback Обработчик, который нужно убрать
 * @returns Булевое значение: убран ли обработчик или нет
 */
export function removeNavigationListener(path: string, callback: PathListener) {
	const bindings = templateListeners.get(path);

	return bindings == null
		? false
		: bindings.delete(callback);
}

/**
 * Получает данные текущей страницы
 *
 * @returns Данные текущей страницы или `null`
 */
export function getCurrentPageData(): IPagesData | null {
	// eslint-disable-next-line
	return (getModule().current) ?? null;
}

/**
 * Проверяет готовность модуля страницы
 *
 * @returns Булевое значение готовности модуля страниц
 */
export function isReady() {
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	return (unsafeWindow.Mu?.pages != null) ?? false;
}

/**
 * Ожидаются или добавлены ли уже наши обработчики
 */
let eventsPending = false;

/**
 * Вешает обработчики или откладывает их до момента когда внешнее API сообщит о готовности
 *
 * @throws {Error} Если обработчики уже ожидают добавления или добавлены
 * @throws {Error} Если внешнее API недоступно (слишком ранний вызов)
 */
export function bindEvents() {
	if (eventsPending) {
		throw new Error("Events are already pending binding or bound.");
	}

	const bind = () => {
		pushLoadedCallback();
		pushUnloadCallback();
	};

	if (isReady()) bind();
	else getExternalAPI().on(PlayerEvent.Ready, bind);

	eventsPending = true;
}
