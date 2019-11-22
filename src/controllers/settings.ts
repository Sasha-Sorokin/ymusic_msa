import * as navigation from "@utils/navigation";
import { Logger } from "@utils/logger";
import { Toggle } from "@yandex/controls/toggleControl";
import { SettingsLine } from "@yandex/controls/settingsLine";
import { SettingsBlock } from "@yandex/controls/settingsBlock";
import { Selector, ISelectorItem } from "@yandex/controls/selector";
import { Event, TriggerFunction } from "@utils/event";
import { NotificationDismissTime, SettingName } from "@common/enums";
import { getStringsMap } from "@utils/i18n";
import { SettingsLineLabel } from "@yandex/controls/settingsLineLabel";

const LOGGER = new Logger("SettingsController");

/**
 * Представляет собой сборный объект состояний контролов настроек
 */
export interface ISettingsStates {
	/**
	 * Включён ли переключатель для уведомлений о текущем треке
	 */
	[SettingName.NowPlayingNotify]: boolean;
	/**
	 * Текущия выбранная опция времени закрытия уведомлений в селекторе
	 */
	[SettingName.NowPlayingNotifyTime]: NotificationDismissTime;
	/**
	 * Включён ли переключатель для клавиши "Вперёд" в конце плейлиста
	 */
	[SettingName.LatestNext]: boolean;
	/**
	 * Включён ли переключатель для перемоткой к началу клавишей "Назад"
	 */
	[SettingName.PreviousSeeking]: boolean;
}

/**
 * Представляет собой обработчик обновлённого состояния настройки
 */
type SettingUpdatedCallback<K extends keyof ISettingsStates = keyof ISettingsStates> =
(setting: K, value: ISettingsStates[K]) => void;

/**
 * Представляет собой реверсивную слабую карту элементов селектора
 */
type DismissSelectorItemsMap = WeakMap<ISelectorItem, NotificationDismissTime>;

/**
 * Waits when settings page is loaded and adds ours controls
 */
export class Settings {
	constructor() {
		this.settings = {
			[SettingName.NowPlayingNotify]: false,
			[SettingName.NowPlayingNotifyTime]: NotificationDismissTime.Auto,
			[SettingName.LatestNext]: false,
			[SettingName.PreviousSeeking]: false,
		};

		{
			const [event, triggerFunc] = Event.create<Settings, SettingUpdatedCallback>();

			this.settingUpdated = event;
			this._triggerSettingsUpdated = triggerFunc;
		}
	}

	/**
	 * Текущий объект настроек
	 */
	public readonly settings: ISettingsStates;

	/**
	 * Событие, которое вызывается при обновлении какой-либо из настроек
	 */
	public readonly settingUpdated: Event<Settings, SettingUpdatedCallback>;

	/**
	 * Функция, используемая для вызова события обновления настроек
	 */
	private readonly _triggerSettingsUpdated: TriggerFunction<Settings, SettingUpdatedCallback>;

	/**
	 * Обновляет настройку и вызывает событие обновления
	 *
	 * @param setting Настройка, которая должна быть обновлена
	 * @param value Новое значение настройки
	 */
	private _updateSetting<K extends SettingName = SettingName>(
		setting: K,
		value: ISettingsStates[K],
	) {
		this.settings[setting] = value;

		this._triggerSettingsUpdated(this, setting, value);
	}

	/**
	 * Привязывает обработчик для события навигации для добавления наших контролов
	 */
	public bindEvents() {
		navigation.onNavigationTo(
			"page-settings",
			({ what }) => this._onSettingsPageLoaded(what),
		);
	}

	/**
	 * Принудительно вызывает проверку текущей страницы
	 * и добавления наших контролов при необходимости
	 */
	public forceUpdateState() {
		const currentPage = navigation.getCurrentPageData();

		if (currentPage == null) return;

		const { what } = currentPage;

		this._onSettingsPageLoaded(what);
	}

	// #region Контролы для уведомлений

	/**
	 * Блок для уведомлений о текущем треке
	 */
	private _notificationsBlock?: SettingsBlock;

	/**
	 * Строка для селектора времени закрытия уведомлений
	 */
	private _dismissSelectorLine?: SettingsLine;

	/**
	 * Слабая "обратная" карта элементов селектора времени и их значения
	 */
	private _dismissSelectorItemsMaps?: DismissSelectorItemsMap;

	/**
	 * Массив элементов для селектора времени закрытия уведомлений
	 */
	private _dismissSelectorItems?: ISelectorItem[];

	/**
	 * Обновляет и возвращает данные для селектора времени закрытия уведомлений
	 *
	 * @returns Кортеж из массива элементов и "обратной" слабой карты с их значениями
	 */
	private _getDismissSelectorData(): [ISelectorItem[], DismissSelectorItemsMap] {
		let reverseMap = this._dismissSelectorItemsMaps;

		if (reverseMap == null) {
			reverseMap = new WeakMap<ISelectorItem, NotificationDismissTime>();

			this._dismissSelectorItemsMaps = reverseMap;
		}

		let items = this._dismissSelectorItems;

		if (items == null) {
			items = [];

			const localizedValues = getStringsMap().notificationsDismissTime;

			const options = <NotificationDismissTime[]> Object.values(NotificationDismissTime);

			for (const option of options) {
				const item = {
					title: localizedValues[option],
					selected: false,
				};

				items.push(item);

				reverseMap.set(item, option);
			}

			this._dismissSelectorItems = items;
		}

		const currentOption = this.settings[SettingName.NowPlayingNotifyTime];

		for (const item of items) {
			const itemOption = reverseMap.get(item)!;

			item.selected = itemOption === currentOption;
		}

		return [items, reverseMap];
	}

	/**
	 * Селектор времени закрытия уведомлений
	 *
	 * Не используйте повторно этот компонент, он сохраняется только для уничтожения потом
	 */
	private _dismissSelector?: Selector;

	/**
	 * Создаёт новый селектор времени закрытия уведомлений
	 *
	 * @returns Новосозданный селектор
	 */
	private _getDismissSelector() {
		let dismissSelector = this._dismissSelector;

		if (dismissSelector != null) {
			LOGGER.log("warn", "Notification dismiss selector detected not destroyed");

			dismissSelector.destroy();

			dismissSelector = undefined;
		}

		const [items, reverseMap] = this._getDismissSelectorData();

		dismissSelector = new Selector({
			className: "yamumsa--notifications_dispose_time",
			items,
		});

		this._dismissSelector = dismissSelector;

		dismissSelector.valueChanged.on((value) => {
			const option = reverseMap.get(value)!;

			this._updateSetting(SettingName.NowPlayingNotifyTime, option);
		});

		dismissSelector.updateState({
			isDisabled: !this.settings[SettingName.NowPlayingNotify],
		});

		return dismissSelector;
	}

	/**
	 * Обновляет и возвращает строку для селектора времени закрытия уведомлений
	 *
	 * @returns Подготовленная строка с селектором
	 */
	private _getDismissSelectorLine() {
		let dismissSelectorLine = this._dismissSelectorLine;

		const localized = getStringsMap().notificationsDismiss;

		if (dismissSelectorLine == null) {
			dismissSelectorLine = new SettingsLine({
				labelText: localized.title,
				labelHint: localized.description,
			});

			this._dismissSelectorLine = dismissSelectorLine;
		}

		this._dismissSelectorLine?.updateState({
			control: this._getDismissSelector(),
		});

		return dismissSelectorLine;
	}

	/**
	 * Переключатель для уведомлений о текущем треке
	 */
	private _notificationsToggle?: Toggle;

	/**
	 * Обновляет и возвращает переключатель для уведомлений о текущем треке
	 *
	 * @returns Подготовленный переключатель
	 */
	private _getNotificationsToggle() {
		let notificationsToggle = this._notificationsToggle;

		if (notificationsToggle == null) {
			notificationsToggle = new Toggle(
				"yamumsa--notifications_enabled", {
					checkFunction: async (pendingValue) => {
						if (!pendingValue) return true;

						const permission = await Notification.requestPermission();

						return permission === "granted";
					},
				},
			);

			notificationsToggle.toggled.on((isToggled) => {
				// TODO: имеет смысл блокировать селектор времени, если уведомления отключены

				this._updateSetting(SettingName.NowPlayingNotify, isToggled);

				this._dismissSelector?.updateState({
					isDisabled: !isToggled,
				});
			});

			this._notificationsToggle = notificationsToggle;
		}

		notificationsToggle.updateState({
			isToggled: this.settings[SettingName.NowPlayingNotify],
		});

		return notificationsToggle;
	}

	/**
	 * Обновляет и возвращает блок настроек уведомлений о текущем треке
	 *
	 * @returns Подготовленный блок настроек
	 */
	private _getNotificationsBlock() {
		let notificationsBlock = this._notificationsBlock;

		if (notificationsBlock == null) {
			const localized = getStringsMap();

			notificationsBlock = new SettingsBlock({
				title: localized.nowPlayingHeader,
			});

			notificationsBlock
				.appendControl(new SettingsLine({
					labelText: localized.notifications.title,
					labelHint: localized.notifications.description,
					control: this._getNotificationsToggle(),
				}));

			this._notificationsBlock = notificationsBlock;
		}

		notificationsBlock.appendControl(
			this._getDismissSelectorLine(),
		);

		return notificationsBlock;
	}

	// #endregion

	// #region Другое

	// #region Настройка перемотки в начало клавишей "назад"

	/**
	 * Переключатель опции перемотки в начало клавишей "назад"
	 */
	private _previousSeekingToggle?: Toggle;

	/**
	 * Обновляет и возвращает переключатель опции перемотки клавишей "назад"
	 *
	 * @returns Подготовленный переключатель
	 */
	private _getPreviousSeekingToggle() {
		let previousSeekingToggle = this._previousSeekingToggle;

		if (previousSeekingToggle == null) {
			previousSeekingToggle = new Toggle("yamumsa__previous_seeking");

			previousSeekingToggle.toggled.on(
				(isToggled) => this._updateSetting(SettingName.PreviousSeeking, isToggled),
			);

			this._previousSeekingToggle = previousSeekingToggle;
		}

		previousSeekingToggle.updateState({
			isToggled: this.settings[SettingName.PreviousSeeking],
		});

		return previousSeekingToggle;
	}

	/**
	 * Строка для переключателя опции перемотки клавишей "назад"
	 */
	private _previousSeekingLine?: SettingsLine;

	/**
	 * Обновляет и возвращает строку для переключателя опции перемотки клавишей "Назад"
	 *
	 * @returns Подготовленная строка
	 */
	private _getPreviousSeekingLine() {
		let previousSeekingLine = this._previousSeekingLine;

		if (previousSeekingLine == null) {
			const localized = getStringsMap().previousSeeking;

			previousSeekingLine = new SettingsLine({
				labelText: localized.title,
				labelHint: localized.description,
			});

			this._previousSeekingLine = previousSeekingLine;
		}

		previousSeekingLine.updateState({
			control: this._getPreviousSeekingToggle(),
		});

		return previousSeekingLine;
	}

	// #endregion

	// #region Настройка клавиши "Вперёд" в конце плейлиста

	/**
	 * Переключатель для опции клавиши "Вперёд" в конце плейлиста
	 */
	private _latestNextToggle?: Toggle;

	/**
	 * Обновляет переключатель для опции клавиши "Вперёд" в конце плейлиста
	 *
	 * @returns Подготовленный переключатель
	 */
	private _getLatestNextToggle() {
		let toggle = this._latestNextToggle;

		if (toggle == null) {
			toggle = new Toggle("yamumsa__latest_next");

			toggle.toggled.on(
				(isToggled) => this._updateSetting(SettingName.LatestNext, isToggled),
			);

			this._latestNextToggle = toggle;
		}

		toggle.updateState({
			isToggled: this.settings[SettingName.LatestNext],
		});

		return toggle;
	}

	/**
	 * Строка для переключателя опции клавиши "Вперёд" в конце плейлиста
	 */
	private _latestNextLine?: SettingsLine;

	/**
	 * Обновляет и возвращает строку переключателя опции клавиши "Вперёд" в конце плейлиста
	 *
	 * @returns Подготовленная строка
	 */
	private _getLatestNextLine() {
		let latestNextLine = this._latestNextLine;

		if (latestNextLine == null) {
			const localized = getStringsMap().latestNext;

			latestNextLine = new SettingsLine({
				labelText: localized.title,
				labelHint: localized.description,
			});

			this._latestNextLine = latestNextLine;
		}

		latestNextLine.updateState({
			control: this._getLatestNextToggle(),
		});

		return latestNextLine;
	}

	// #endregion

	/**
	 * Строка с описанием блока настроек клавиш
	 */
	private _mediaKeysInfoLine?: SettingsLineLabel;

	/**
	 * Обновляет и возвращает строку с описанием блока настроек клавиш
	 *
	 * @returns Подготовленный блок
	 */
	private _getMediaKeysInfoLine() {
		let mediaKeysInfoLine = this._mediaKeysInfoLine;

		if (mediaKeysInfoLine == null) {
			mediaKeysInfoLine = new SettingsLineLabel({
				content: getStringsMap().mediaKeys.description,
				isSecondary: true,
			});

			this._mediaKeysInfoLine = mediaKeysInfoLine;
		}

		return mediaKeysInfoLine;
	}

	/**
	 * Блок настроек медиа-клавиш
	 */
	private _mediaKeysBlock?: SettingsBlock;

	/**
	 * Обновляет и возвращает блок с настройками медиа-клавиш
	 *
	 * @returns Подготовленный блок
	 */
	private _getMediaKeysBlock() {
		let mediaKeysBlock = this._mediaKeysBlock;

		if (mediaKeysBlock == null) {
			mediaKeysBlock = new SettingsBlock({
				title: getStringsMap().mediaKeys.title,
			});

			this._mediaKeysBlock = mediaKeysBlock;
		}

		mediaKeysBlock.updateState({
			controls: [
				this._getMediaKeysInfoLine(),
				this._getPreviousSeekingLine(),
				this._getLatestNextLine(),
			],
		});

		return mediaKeysBlock;
	}

	// #endregion

	/**
	 * Последняя отрапортованная страница настроек, на которую переходил пользователь
	 */
	private _currentPage?: string;

	/**
	 * Проверяет, если страница настроек изменилась и нам необходимо встроить свои контролы
	 *
	 * @param newPage На какую страницу перешёл пользователь сейчас
	 * @returns Булевое значение необходимости встраивать свои компоненты
	 */
	private _settingsPageChanged(newPage: string) {
		if (this._currentPage === newPage) return false;

		this._currentPage = newPage;

		return true;
	}

	/**
	 * Метод, вызываемый после навигации пользователем на любую страницу настроек
	 *
	 * @param currentPage Какая страница настроек была загружена
	 */
	private _onSettingsPageLoaded(currentPage: string) {
		if (!this._settingsPageChanged(currentPage)) return;

		switch (currentPage) {
			case "notifications": {
				const target = document.querySelector(".page-settings--notifications");

				if (target == null) break;

				navigation.navigatedEvent.once(() => {
					this._dismissSelector?.destroy();

					this._dismissSelector = undefined;
				});

				this._getNotificationsBlock().mountTo(target, true);
			} break;
			case "other": {
				const target = document.querySelector(".page-settings--other");

				if (target == null) break;

				this._getMediaKeysBlock().mountTo(target);
			} break;
			default: {
				// LOGGER.log("log", `No settings available for page "${currentPage}"`);
			} break;
		}
	}
}
