import { getExternalAPI, IExternalAPI, PlayerEvent } from "@yandex/externalAPI";

interface IListenersMap {
	[event: string]: (() => void) | undefined;
}

const $BOUND_LISTENERS = Symbol("boundListeners");

/**
 * Представляет собой класс, который базируется на внешнем API
 */
export abstract class ExternalAPIBased {
	constructor() {
		const externalAPI = getExternalAPI();

		if (externalAPI == null) {
			throw new Error("External API is not available");
		}

		this._externalAPI = externalAPI;

		this._externalAPI = externalAPI;

		this[$BOUND_LISTENERS] = Object.create(null);
	}

	/**
	 * Внешнее API Яндекс.Музыки
	 */
	protected readonly _externalAPI: IExternalAPI;

	/**
	 * Карта привязанных обработчиков
	 */
	private readonly [$BOUND_LISTENERS]: IListenersMap;

	/**
	 * Привязывает обработчик к событию внешнего API
	 *
	 * Из-за сложности с типизацией, данный метод не работает для события рекламы
	 *
	 * @param event Собитие к которому выполняется привязка
	 * @param callback Колбэк функция, вызываемая для события
	 *
	 * @throws {Error} Если к событию уже привязан другой обработчик
	 */
	protected _bindListener(event: Exclude<PlayerEvent, PlayerEvent.Advert>, callback: () => void) {
		const listeners = this[$BOUND_LISTENERS];

		if (listeners[event] != null) {
			throw new Error(`Event "${event}" is bound already.`);
		}

		this._externalAPI.on(event, callback);

		listeners[event] = callback;
	}

	/**
	 * Убирает обработчик с события внешнего API
	 *
	 * @param event Событие, к которому привязан обработчик
	 *
	 * @throws {Error} Если к событию не был привязан ни один обработчик
	 */
	protected _unbindListener(event: Exclude<PlayerEvent, PlayerEvent.Advert>) {
		const listeners = this[$BOUND_LISTENERS];
		const listener = listeners[event];

		if (listener == null) {
			throw new Error(`Event "${event}" is not bound.`);
		}

		this._externalAPI.off(event, listener);

		listeners[event] = undefined;
	}
}
