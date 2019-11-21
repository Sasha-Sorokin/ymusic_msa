/**
 * Представляет собой хэш-карту обработчиков
 */
interface IEventListenersMap {
	[event: string]: (e: unknown) => void;
}

/**
 * Представляет собой хэш-карту стилей элемента
 */
type StylesMap = {
	[style in keyof CSSStyleDeclaration]: string;
};

/**
 * Представляет собой хэш-карту атрибутов
 */
interface IAttributesMap {
	[attribute: string]: string;
}

/**
 * Представляет собой набор данных объекта
 */
interface IDataSet {
	[dataKey: string]: string;
}

// Огромная благодарность за этот тип автору статьи:
// https://medium.com/dailyjs/typescript-create-a-condition-based-subset-types-9d902cea5b8c
/**
 * Представляет собой объект со свойствами объекта `T`, которые наследуют `C`
 */
type SubType<T, C> = Pick<T, {
	[K in keyof T]: T[K] extends C ? K : never
}[keyof T]>;

/**
 * Представляет собой хэш-карту только примитивных свойств объекта
 */
type PropertiesMap<T> = Partial<SubType<T, string | number | boolean>>;

/**
 * Представляет собой базовые опции конфигурации создаваемого элемента
 */
interface IElementCreationOptions<T extends HTMLElement> {
	/**
	 * Свойства, которые необходимо присвоить элементу
	 */
	props?: PropertiesMap<T>;
	/**
	 * Стили, которые необходимо присвоить элементы
	 */
	style?: StylesMap;
	/**
	 * Обработчики, которые необходимо привязать к событиям объекта
	 */
	events?: IEventListenersMap;
	/**
	 * Атрибуты, которые необходимо установить у элемента
	 */
	attributes?: IAttributesMap;
	/**
	 * Набор данных, который нужно присвоить объекту
	 */
	dataSet?: IDataSet;
	/**
	 * Элемент, дочерним которого необходимо встроить созданный элемент
	 */
	mount?: Element;
	/**
	 * Дочерний элемент, который необходимо встроить в созданный элемент
	 */
	child?: Element;
	/**
	 * Массив дочерних элементов, которые необходимо встроить в созданный элемент
	 */
	children?: Node[];
}

/**
 * Встраивает элемент в родительский элемент перед другим его дочерним объектом
 *
 * @param refChild Дочерний элемент, перед которым встраивается элемент
 * @param newNode Элемент, который должен быть встроен
 * @throws {Error} Если у дочернего элемента `refChild` отсутствует родительский элемент
 */
export function insertBefore(refChild: Element, newNode: Element) {
	if (refChild.parentNode == null) {
		throw new Error("Node has no parent.");
	}

	refChild.parentNode.insertBefore(newNode, refChild);
}

/**
 * Привязывает обработчики событий к элементу из хэш-карты
 *
 * @param element Элемент, к которому привязываются данные обработчики
 * @param eventListeners Хэш-карта обработчиков для привязки
 * @returns Сам элемент, но отныне реагирующий на события
 */
export function addEventListeners(element: Element, eventListeners: IEventListenersMap) {
	for (const eventName of Object.keys(eventListeners)) {
		element.addEventListener(eventName, eventListeners[eventName]);
	}

	return element;
}

/**
 * Присваивает элементу стили из хэш-карты
 *
 * @param element Элемент, которому присваиваются стили
 * @param styles Хэш-карта стилей для присваивания
 * @returns Сам элемент, но отныне одетый, как чёрт
 */
export function assignStyles(element: HTMLElement, styles: StylesMap) {
	Object.assign(element.style, styles);

	return element;
}

/**
 * Присваивает элементу атрибуты из хэш-карты
 *
 * @param element Элемент, которому присваиваются атрибуты
 * @param attributes Хэш-карта атрибутов для присваивания
 * @returns Сам элемент, облепленный атрибутами
 */
export function assignAttributes(element: Element, attributes: IAttributesMap) {
	for (const attribute of Object.keys(attributes)) {
		element.setAttribute(attribute, attributes[attribute]);
	}

	return element;
}

/**
 * Присваивает элементу набор данных из хэш-карты
 *
 * @param element Элемент, которому присваюиваются данные
 * @param values Хэш-карта присваиваемых данных
 * @returns Сам элемент, но с данными
 */
export function assingDataValues(element: HTMLElement, values: DOMStringMap) {
	Object.assign(element.dataset, values);

	return element;
}

/**
 * Встраивает каждый узел из массива в данный родительский элемент
 *
 * @param nodes Узлы, которые необходимо встроить в данный родительский элемент
 * @param parent Родительский элемент, в который будут встроены узлы
 */
export function appendEvery(nodes: Node[], parent: Element) {
	for (const element of nodes) parent.appendChild(element);
}

/**
 * Создаёт новый элемент и меняет его свойства, а также встраивает
 * по желанию его в другой элемент или другие элементы в него
 *
 * @param tagName Тег создаваемого элемента
 * @param options Опции для создаваемого элемента
 * @returns Новосозданный элемент
 */
export function createElement<T extends HTMLElement>(
	tagName: string,
	options?: IElementCreationOptions<T>,
): T {
	const el = document.createElement(tagName);

	if (options != null) {
		const {
			props,
			style,
			events,
			attributes,
			dataSet,
			mount,
			child,
			children,
		} = options;

		if (props != null) Object.assign(el, props);
		if (attributes != null) assignAttributes(el, attributes);
		if (dataSet != null) assingDataValues(el, dataSet);
		if (style != null) assignStyles(el, style);
		if (events != null) addEventListeners(el, events);
		if (mount instanceof HTMLElement) mount.appendChild(el);

		if (child != null) el.appendChild(child);
		if (children != null) appendEvery(children, el);
	}

	return <T> el;
}
