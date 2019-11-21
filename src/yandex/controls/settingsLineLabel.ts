import { Control } from "@common/control";
import { createElement } from "@utils/DOM";

/**
 * Представляет собой состояние надписи
 */
interface ILabelState {
	/**
	 * Содержимое надписи
	 */
	content?: string;

	/**
	 * Является ли надпись вторичной по приоритету прочтения
	 */
	isSecondary?: boolean;
}

/**
 * Представляет собой надпись в настройках
 */
export class SettingsLineLabel extends Control<ILabelState> {
	/**
	 * Создаёт новую надпись для настроек
	 *
	 * @param initialState Изначальное состояние надписи
	 */
	constructor(initialState?: ILabelState) {
		super();

		const container = createElement<HTMLDivElement>("div", {
			props: {
				className: "page-settings__line-label-container",
			},
		});

		this._container = container;

		const labelContainer = createElement<HTMLDivElement>("div", {
			props: {
				className: "page-settings__line-label",
			},
			mount: container,
		});

		const label = createElement<HTMLDivElement>("div", {
			props: {
				className: "typo",
			},
			mount: labelContainer,
		});

		this._label = label;

		if (initialState != null) this.updateState(initialState);
	}

	/**
	 * Элемент надписи для встраивания
	 */
	private readonly _container: HTMLDivElement;

	/**
	 * Элемент самой надписи для изменения
	 */
	private readonly _label: HTMLDivElement;

	public updateState(state: ILabelState): boolean {
		let anythingChanged = false;

		if (state.content != null) {
			this._label.innerText = state.content;

			anythingChanged = true;
		}

		if (state.isSecondary != null) {
			this._label.classList.toggle("typo-secondary", state.isSecondary);
			this._label.classList.toggle("deco-typo-secondary", state.isSecondary);

			anythingChanged = true;
		}

		return anythingChanged;
	}

	public mountTo(parent: HTMLElement, prepend: boolean) {
		this._mount(this._container, parent, prepend);
	}

	protected _getControlElement() {
		return this._container;
	}
}
