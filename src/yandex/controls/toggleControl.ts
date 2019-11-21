import { Control } from "@common/control";
import { createElement } from "@utils/DOM";
import { getStringsMap } from "@utils/i18n";
import { Event, TriggerFunction } from "@utils/event";

/**
 * Представляет собой функцию проверки нового состояния переключателя
 */
type ToggleCheckFunction = (pendingState: boolean) => Promise<boolean>;

/**
 * Представляет собой состояние переключателя
 */
interface IToggleState {
	/**
	 * Функция для проверки нового значения
	 *
	 * При установке функции проверки, при каждом переключении
	 * элемент будет залипать в процессе, пока функция не вернёт
	 * значение следует ли осуществлять переключение
	 */
	checkFunction?: ToggleCheckFunction | null;
	/**
	 * Включён ли переключатель
	 */
	isToggled?: boolean;
}

/**
 * Обработчик события переключения
 */
type ToggleCallback = (isToggled: boolean) => unknown;

/**
 * Представляет собой переключатель в настройках
 */
export class Toggle extends Control<IToggleState> {
	/**
	 * Создаёт новый переключатель
	 *
	 * @param id ID для чекбокса внутри переключателя
	 * @param initialState Изначальное состояние переключателя
	 */
	constructor(id: string, initialState?: IToggleState) {
		super();

		const checkbox = createElement<HTMLInputElement>("input", {
			props: {
				className: "d-toggler__input",
				type: "checkbox",
				id,
			},
		});

		this._checkbox = checkbox;

		const button = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-toggler__btn deco-toggler-btn",
			},
		});

		this._button = button;

		let isPending = false;

		const view = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-toggler__view deco-toggler-view",
			},
			children: [
				createElement<HTMLDivElement>("div", {
					props: {
						className: "d-toggler__bg deco-toggler-bg",
					},
				}),
				button,
				createElement<HTMLDivElement>("div", {
					props: {
						className: "d-toggler__border deco-toggler-border",
					},
				}),
			],
			events: {
				click: async () => {
					if (isPending) return;

					const pendingState = !checkbox.checked;

					if (this._checkFunction != null) {
						this._togglePending(isPending = true);

						const result = await this._checkFunction(pendingState);

						this._togglePending(isPending = false);

						if (!result) return;
					}

					checkbox.checked = pendingState;

					this.updateState({
						isToggled: checkbox.checked,
					});
				},
			},
		});

		const text = createElement("span", {
			props: {
				className: "d-toggler__text d-toggler__text_selected deco-toggler-text",
			},
		});

		// Элемент противоположного текста необходим, чтобы переключатель не прыгал
		const oppositeText = createElement("span", {
			props: {
				className: "d-toggler__text d-toggler__text_opposite deco-toggler-text",
			},
		});

		this._selectedText = text;
		this._oppositeText = oppositeText;

		const value = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-toggler__value",
			},
			children: [text, oppositeText],
		});

		this._wrap = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-toggler deco-toggler d-toggler_size-M",
			},
			children: [
				createElement("div", {
					props: {
						className: "d-toggler__content",
					},
					children: [
						checkbox,
						view,
						value,
					],
				}),
			],
		});

		const [event, trigger] = Event.create();

		this.toggled = event;
		this._toggledTrigger = trigger;

		if (initialState != null) this.updateState(initialState);
	}

	/**
	 * Событие, срабатывающее при переключении
	 */
	public readonly toggled: Event<Toggle, ToggleCallback>;

	/**
	 * Функция для вызова события переключения
	 */
	private readonly _toggledTrigger: TriggerFunction<Toggle, ToggleCallback>;

	/**
	 * Родительский элемент для встраивания
	 */
	private readonly _wrap: HTMLDivElement;

	/**
	 * Элемент "кнопки" переключателя
	 */
	private readonly _button: HTMLDivElement;

	/**
	 * Элемент чекбокса, хранящего текущее состояние переключателя
	 */
	private readonly _checkbox: HTMLInputElement;

	/**
	 * Элемент с отображаемым состоянием переключателя
	 */
	private readonly _selectedText: HTMLSpanElement;

	/**
	 * Элемент, содержащий текст для состояния противоположного текущему
	 */
	private readonly _oppositeText: HTMLSpanElement;

	/**
	 * Текущая функция, используемая для проверки нового состояния
	 */
	private _checkFunction?: ToggleCheckFunction;

	public mountTo(parent: Element, prepend?: boolean): void {
		this._mount(this._wrap, parent, prepend);
	}

	public updateState(state: IToggleState): boolean {
		let anythingChanged = false;

		if (state.checkFunction != null) {
			this._checkFunction = state.checkFunction;

			anythingChanged = true;
		}

		if (state.isToggled != null) {
			this._checkbox.checked = state.isToggled;

			this._wrap.classList.toggle("deco-toggler_on", state.isToggled);

			const localized = getStringsMap().toggleState;

			this._selectedText.innerText = localized[state.isToggled ? "on" : "off"];
			this._oppositeText.innerText = localized[!state.isToggled ? "on" : "off"];

			this._toggledTrigger(this, state.isToggled);

			anythingChanged = true;
		}

		return anythingChanged;
	}

	/**
	 * Вводит переключатель в состояния переключения и блокирует отзывчивость на клики
	 *
	 * @param isPending Ввести/вывести ли переключатель из этого состояния
	 */
	private _togglePending(isPending: boolean) {
		this._button.style.left = isPending ? "18px" : "";
		this._wrap.style.pointerEvents = isPending ? "none" : "";
		this._wrap.style.opacity = isPending ? ".8" : "";
	}

	protected _getControlElement() {
		return this._wrap;
	}
}
