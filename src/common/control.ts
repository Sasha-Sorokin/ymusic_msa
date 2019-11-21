/**
 * Представляет из себя интерактивный контрол
 */
export abstract class Control<S> {
	/**
	 * Встраивает контрол в предоставленное место
	 *
	 * @param parent Родительский элемент, куда нужно встроить контрол
	 * @param prepend Нужно ли встраивать контрол в самое начало
	 */
	public abstract mountTo?(parent: Element, prepend?: boolean): void;

	/**
	 * Встроенная функция встраивания контрола
	 *
	 * @param element Встраиваемый элемент этого контрола
	 * @param parent Родительский элемент, куда встраивается контрол
	 * @param prepend Нужно ли встраивать контрол в самое начало
	 */
	protected _mount(element: Element, parent: Element, prepend: boolean = false) {
		if (prepend != null && prepend) parent.prepend(element);
		else parent.appendChild(element);
	}

	/**
	 * Обновляет состояние контрола
	 *
	 * @param state Новое состояние контрола
	 * @returns Изменилось ли что-нибудь
	 */
	public abstract updateState(state: S): boolean;

	/**
	 * Получает главный (родительский) элемент контрола
	 */
	protected abstract _getControlElement(): Element;

	/**
	 * Проверяет если элемент прендалежит к данному контролу или нет
	 *
	 * @param element Элемент чтобы проверить
	 * @param control Контрол для проверки
	 * @returns Булев обозначающий пренадлежит ли элемент к контролу или нет
	 */
	public static isFrom(element: Element, control: Control<unknown>) {
		// eslint-disable-next-line no-underscore-dangle
		return control._getControlElement() === element;
	}

	/**
	 * Из данного массива контролов ищет контол, к которому пренадлежит элемент
	 * и возвращает его
	 *
	 * @param element Искомый элемент
	 * @param controls Массив контролов для поиска
	 * @returns Контрол к которому пренадлежит элемент или `undefined`
	 */
	public static searchIn<T>(element: Element, controls: Control<T>[]) {
		const predicate = (control: Control<T>) => Control.isFrom(element, control);

		return <Control<T>> Array.prototype.find.call(controls, predicate);
	}
}

export type MountableControl<S = unknown> = Control<S> & Required<Pick<Control<S>, "mountTo">>;
