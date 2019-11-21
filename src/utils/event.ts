type Callback = (...args: any[]) => void;

/**
 * Представляет собой "слушателя" события
 */
interface IListener<D> {
	/**
	 * Вызываемый обработчик для этого слушателя
	 */
	callback: D;
	/**
	 * Должен ли слушатель оставаться на месте после вызова события
	 */
	persistent: boolean;
}

/**
 * Представляет собой функцию вызова события
 */
export type TriggerFunction<T, D extends Callback> = (caller: T, ...args: Parameters<D>) => void;

/**
 * Слабая карта когда-либо созданных слушателей для быстрого доступа
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LISTENERS_MAP = new WeakMap<Callback, IListener<any>>();

/**
 * Представляет собой какое-то событие для объекта `T`, которое принимает обработчики `D`
 */
export class Event<T, D extends Callback> {
	private constructor() {
		this._listeners = new Set();
	}

	/**
	 * Набор "слушателей", обработчики которых вызываются при срабатывании метода
	 */
	private readonly _listeners: Set<IListener<D>>;

	/**
	 * Создаёт "слушателя" для данного события
	 *
	 * @param callback Обработчик, вызываемый по происхождению события
	 * @param persistent Булевое значение определяющее постоянство "слушателя"
	 * @returns Созданный "слушатель"
	 */
	private _createListener(callback: D, persistent: boolean) {
		const listener: IListener<D> = {
			callback,
			persistent,
		};

		LISTENERS_MAP.set(callback, listener);

		this._listeners.add(listener);

		return listener;
	}

	/**
	 * Привязывает обработчик к данному событию
	 *
	 * @param callback Обработчик, вызываемый по происхождению этого события
	 * @returns Этот же объект события для цепочных вызовов
	 */
	public on(callback: D) {
		this._createListener(callback, true);

		return this;
	}

	/**
	 * Привязывает единоразовый обработчик к данному событию
	 *
	 * @param callback Обработчик, единожды вызываемый по происхождению этого события
	 * @returns Этот же объект события для цепочных вызовов
	 */
	public once(callback: D) {
		this._createListener(callback, false);

		return this;
	}

	/**
	 * Убирает обработчик для данного события
	 *
	 * @param callback Обработчик добавленный ранее
	 * @returns Этот же объект события для цепочных вызовов
	 */
	public off(callback: D) {
		const listener = LISTENERS_MAP.get(callback);

		if (listener != null) {
			this._listeners.delete(listener);

			LISTENERS_MAP.delete(callback);
		}

		return this;
	}

	/**
	 * Вызывает все обработчики этого события
	 *
	 * @param thisArg Объект, для которого произошло событие
	 * @param args Аргументы для обработчиков данного события
	 */
	private _trigger(thisArg: T, args: unknown[]) {
		const listeners = this._listeners;

		for (const listener of listeners) {
			listener.callback.apply(thisArg, args);

			if (!listener.persistent) listeners.delete(listener);
		}
	}

	/**
	 * Создаёт новый объект события
	 *
	 * @returns Кортеж из объекта события и функции для вызова события
	 */
	public static create<T, D extends Callback>(): [Event<T, D>, TriggerFunction<T, D>] {
		const event = new Event<T, D>();

		// eslint-disable-next-line no-underscore-dangle
		const trigger = (eventOwner: T, ...args: Parameters<D>) => event._trigger(eventOwner, args);

		return [event, trigger];
	}
}
