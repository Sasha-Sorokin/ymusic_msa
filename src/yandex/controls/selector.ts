import { Control } from "@common/control";
import { createElement } from "@utils/DOM";
import { Event } from "@utils/event";
import { createBlock } from "./_block";

/**
 * Представляет собой состояние селектора
 */
interface ISelectorState {
	/**
	 * Выбранный в селекторе элемент
	 */
	selectedItem?: ISelectorItem;
	/**
	 * Отключён ли селектор
	 */
	isDisabled?: boolean;
}

/**
 * Представляет собой элемент для селектора
 */
export interface ISelectorItem {
	/**
	 * Текст элемента
	 */
	title: string;
	/**
	 * Выбран ли этот элемент
	 */
	selected: boolean;
}

/**
 * Представляет собой данные, необходимые для создания селектора
 */
interface ISelectorData {
	/**
	 * Название класса селектора
	 */
	className: string;
	/**
	 * Элементы селектора
	 */
	items: ISelectorItem[];
}

/**
 * Перечисление всех событий селектора
 */
const enum SelectorBlockEvent {
	/**
	 * Событие, срабатывающее при изменении выбора
	 */
	ValueChanged = "change",
}

// Что мы творим...

/**
 * Представляет детали события изменения выбора в селекторе
 */
interface ISelectorBlockChangeDetails {
	/**
	 * Селектор
	 */
	target: ISelectorBlock;
	/**
	 * Индекс выбранного элемента
	 */
	index: number;
	/**
	 * Выбранный элемент
	 */
	value: ISelectorItem;
	/**
	 * Все выбранные элементы
	 */
	all: ISelectorItem[];
}

/**
 * Представляет собой обработчик события изменения выбора в селекторе
 */
type ChangeEventCallback = (details: ISelectorBlockChangeDetails) => void;

/**
 * Представляет собой объект селектора
 */
interface ISelectorBlock extends IBlock {
	on(event: SelectorBlockEvent.ValueChanged, callback: ChangeEventCallback): void;
	val(item?: ISelectorItem): ISelectorItem;
	destroy(): void;
}

// Возможно, мы могли бы добавить поддержку других функций в селекторе,
// но это просто не имеет смысла, поэтому ограничиваемся самым главным

/**
 * Представляет собой публичный обработчик события изменения выбора в селекторе
 */
type ValueChangedCallback = (value: ISelectorItem) => void;

/**
 * Представляет собой контрол селектора
 */
export class Selector extends Control<ISelectorState> {
	/**
	 * Создаёт новый контрол селектора
	 *
	 * @param data Данные, необходимые для создания селектора
	 * @param initialState Изначальное состояние селектора
	 */
	constructor(data: ISelectorData, initialState?: ISelectorState) {
		super();

		const selectedItem = data.items.find(
			(item: ISelectorItem) => item.selected,
		);

		const innerItem = createElement<HTMLSpanElement>("span", {
			props: {
				className: "d-select__inner-item",
			},
			child: createElement<HTMLSpanElement>("span", {
				props: {
					className: "d-select__text",
					// eslint-disable-next-line
					innerText: selectedItem?.title ?? "",
				},
			}),
		});

		const dropdownButton = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-select__button deco-button-simple deco-button",
			},
			child: createElement<HTMLSpanElement>("span", {
				props: {
					className: "d-icon deco-icon d-icon_dropdown",
				},
			}),
		});

		const inner = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-select__inner deco-button-stylable",
			},
			children: [innerItem, dropdownButton],
		});

		const wrap = createElement<HTMLDivElement>("div", {
			props: {
				className: "d-select deco-button",
			},
			child: inner,
		});

		wrap.classList.add(data.className);

		this._wrap = wrap;

		const block = <ISelectorBlock> createBlock({
			type: "d-select",
			data: {
				class: data.className,
				groups: [data.items],
			},
		}, wrap);

		this._block = block;

		const [changedEvent, changedTrigger] = Event.create<Selector, ValueChangedCallback>();

		this.valueChanged = changedEvent;

		block.on(
			SelectorBlockEvent.ValueChanged,
			(details) => {
				changedTrigger(this, details.value);
			},
		);

		if (initialState != null) this.updateState(initialState);
	}

	/**
	 * Событие, срабатывающее при изменении выбора в селекторе
	 */
	public readonly valueChanged: Event<Selector, ValueChangedCallback>;

	/**
	 * Родительский элемент для встраивания
	 */
	private readonly _wrap: HTMLDivElement;

	/**
	 * Интерактивный элемент селектора
	 */
	private readonly _block: ISelectorBlock;

	public mountTo(parent: Element, prepend: boolean = false): void {
		this._mount(this._wrap, parent, prepend);
	}

	public updateState(state: ISelectorState): boolean {
		let anythingChanged = false;

		if (state.isDisabled != null) {
			this._block.toggleDisabled(state.isDisabled);

			anythingChanged = true;
		}

		if (state.selectedItem != null) {
			this._block.val(state.selectedItem);

			anythingChanged = true;
		}

		return anythingChanged;
	}

	/**
	 * Уничтожает селектор, удаляя все данные, popup и делая его неинтерактивным
	 *
	 * Уничтоженный селектор необходимо повторно инициализировать с новыми
	 * данными, что почти равносильно созданию нового селектора, поэтому
	 * функционал инициализации селектора не реализуем и уничтоженные
	 * селекторы больше **не следует использовать**.
	 */
	public destroy() {
		this._block.destroy();
	}

	protected _getControlElement() {
		return this._wrap;
	}
}
