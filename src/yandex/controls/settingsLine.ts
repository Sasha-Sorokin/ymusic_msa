import { Control, MountableControl } from "@common/control";
import { createElement } from "@utils/DOM";

/**
 * Представляет собой состояния строки настройки
 */
interface ISettingsLineState {
	/**
	 * Заголовок строки настройки
	 */
	labelText?: string;
	/**
	 * Текст под заголовком (описание)
	 */
	labelHint?: string;
	/**
	 * Встраиваемый в строку контрол
	 */
	control?: MountableControl;
}

/**
 * Представляет собой строку настройки с заголовком и описанием
 */
export class SettingsLine extends Control<ISettingsLineState> {
	/**
	 * Создаёт новую строку настройки
	 *
	 * @param state Изначальное состояние строки
	 */
	constructor(state?: ISettingsLineState) {
		super();

		const labelNode = document.createTextNode("&nbsp;");

		this._labelTextNode = labelNode;

		const label = createElement<HTMLDivElement>("div", {
			props: {
				className: "page-settings__line-label typo",
			},
			children: [labelNode],
		});

		this._label = label;

		this._wrap = createElement<HTMLDivElement>("div", {
			props: {
				className: "page-settings__line deco-border",
			},
			child: label,
		});

		if (state != null) this.updateState(state);
	}

	/**
	 * Родительский элемент строки для встраивания
	 */
	private readonly _wrap: HTMLDivElement;

	/**
	 * Элемент заголовка строки
	 */
	private readonly _label: HTMLDivElement;

	/**
	 * Текстовый узел для изменения текста заголовка
	 */
	private readonly _labelTextNode: Text;

	/**
	 * Элемент для встраивания контрола
	 */
	private _controlBlock?: HTMLDivElement;

	/**
	 * Элемент текста под заголовком (описания)
	 */
	private _labelHint?: HTMLDivElement;

	/**
	 * Возвращает или создаёт элемент текста под заголовоком
	 *
	 * @returns Элемент текста под заголовком
	 */
	private _getLabelHint() {
		let labelHint = this._labelHint;

		if (labelHint == null) {
			labelHint = createElement<HTMLDivElement>("div", {
				props: {
					className: "typo-secondary",
				},
				mount: this._label,
			});

			this._labelHint = labelHint;
		}

		return labelHint;
	}

	/**
	 * Возвращает или создаёт элемент для встраивания контрола
	 *
	 * @returns Элемент для встраивания контрола
	 */
	private _getControlMount() {
		let controlMount = this._controlBlock;

		if (controlMount == null) {
			controlMount = createElement<HTMLDivElement>("div", {
				props: {
					className: "page-settings__line-control",
				},
			});

			this._controlBlock = controlMount;
		}

		return controlMount;
	}

	public mountTo(parent: Element, prepend?: boolean): void {
		this._mount(this._wrap, parent, prepend);
	}

	public updateState(state: ISettingsLineState): boolean {
		let anythingChanged = false;

		if (state.labelText !== undefined) {
			// eslint-disable-next-line
			this._labelTextNode.textContent = state.labelText ?? "";

			anythingChanged = true;
		}

		if (state.labelHint !== undefined) {
			const labelHint = this._getLabelHint();

			// eslint-disable-next-line
			labelHint.innerText = state.labelHint ?? "";

			const isMounted = labelHint.parentElement === this._label;

			if (state.labelHint == null) {
				if (isMounted) labelHint.remove();
			} else if (!isMounted) {
				this._label.appendChild(labelHint);
			}

			anythingChanged = true;
		}

		if (state.control !== undefined) {
			const controlMount = this._getControlMount();

			const isMounted = controlMount.parentElement === this._wrap;

			controlMount.innerHTML = "";

			if (state.control != null) {
				state.control.mountTo(controlMount);

				if (!isMounted) this._wrap.appendChild(controlMount);
			} else if (isMounted) {
				controlMount.remove();
			}

			anythingChanged = true;
		}

		return anythingChanged;
	}

	protected _getControlElement() {
		return this._wrap;
	}
}
