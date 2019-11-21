import { Control, MountableControl } from "@common/control";
import { createElement } from "@utils/DOM";

/**
 * Представляет собой состояние блока настроек
 */
interface ISettingsBlockState {
	/**
	 * Заголовок блока настроек
	 */
	title?: string | null;
	/**
	 * Контролы в этом блоке
	 *
	 * **Перед встраиванием очищает блок настроек**
	 */
	controls?: MountableControl[];
}

/**
 * Представляет собой блок настроек
 */
export class SettingsBlock extends Control<ISettingsBlockState> {
	/**
	 * Создаёт новый блок настроек
	 *
	 * @param initialState Изначальное состояние блока
	 */
	constructor(initialState?: ISettingsBlockState) {
		super();

		this._block = createElement<HTMLDivElement>("div", {
			props: {
				className: "page-settings__block",
			},
		});

		if (initialState != null) this.updateState(initialState);
	}

	/**
	 * Родительский элемент блока для встраивания
	 */
	private readonly _block: HTMLDivElement;

	public mountTo(parent: Element, prepend?: boolean): void {
		this._mount(this._block, parent, prepend);
	}

	/**
	 * Элемент заголовка блока
	 */
	private _title?: HTMLHeadingElement;

	/**
	 * Возвращает или создаёт новый элемент заголовка блока
	 *
	 * @returns Элемент заголовка блока
	 */
	private _getTitle() {
		let title = this._title;

		if (title == null) {
			title = createElement<HTMLHeadingElement>("h2", {
				props: {
					className: "page-settings__subtitle typo-h2_bold",
				},
			});

			this._title = title;
		}

		return title;
	}

	/**
	 * Встраивает новую строку в блок
	 *
	 * @param control Новая строка для встраивания
	 * @returns Блок сам по себе для цепочных вызовов
	 */
	public appendControl(control: MountableControl) {
		control.mountTo(this._block, false);

		return this;
	}

	/**
	 * Обновляет заголовок блока как указано в объекте состояния
	 *
	 * @param state Объект обновления состояния
	 * @returns Булевое значение, обозначающее изменилось ли что-нибудь
	 */
	private _updateTitle(state: ISettingsBlockState) {
		if (state.title == null && this._title == null) return false;

		const title = this._getTitle();

		const isMounted = title.parentElement === this._block;

		if (state.title == null) {
			if (isMounted) {
				title.remove();

				return true;
			}

			return false;
		}

		if (!isMounted) this._block.prepend(title);

		title.textContent = state.title;

		return true;
	}

	/**
	 * Обновляет контролы внутри блока на указанные в объекте состояния
	 *
	 * @param state Объект обновления состояния
	 * @returns Булевое значение, обозначающее изменилось ли что-нибудь
	 */
	private _updateControls(state: ISettingsBlockState) {
		const { controls } = state;

		if (controls == null) return false;

		this._block.childNodes.forEach((node) => {
			node.remove();
		});

		const title = this._title;

		if (title != null) this._block.appendChild(title);

		for (const control of controls) {
			control.mountTo(this._block);
		}

		return true;
	}

	public updateState(state: ISettingsBlockState): boolean {
		let anythingChanged = false;

		if (this._updateTitle(state)) {
			anythingChanged = true;
		}

		if (this._updateControls(state)) {
			anythingChanged = true;
		}

		return anythingChanged;
	}

	protected _getControlElement() {
		return this._block;
	}
}
