import { Logger } from "@utils/logger";
import * as navigation from "@utils/navigation";
import { tryDetectLocale, getStringsMap } from "@utils/i18n";
import { SettingName, NotificationDismissTime } from "@common/enums";
import { getValueOrDefault, setValue } from "@utils/storage";
import { getExternalAPI, PlayerEvent, isPlayerReady } from "./yandex/externalAPI";
import { MetadataUpdater } from "./controllers/metadataUpdater";
import { ControlsUpdater } from "./controllers/controlsUpdater";
import { Settings as SettingsAdditions } from "./controllers/settings";
import { NowPlayingNotifications } from "./controllers/nowPlayingNotifications";
import { showNotify } from "./yandex/notify";

const currentVersion = "__currentVersion__";

Logger.setBaseName("Yandex.Music MSA");

const logger = new Logger("Bootstrap");

logger.log("log", "Initializing...");

tryDetectLocale();

const metadataUpdater = new MetadataUpdater();
const controlsUpdater = new ControlsUpdater();
const notifications = new NowPlayingNotifications();
const settingsAdditions = new SettingsAdditions();

/**
 * Применяет сохранённые настройки
 */
async function applySettings() {
	{ // Кнопка "Вперёд" в конце плейлиста
		const setting = SettingName.LatestNext;

		const value = await getValueOrDefault<boolean>(setting, false);

		controlsUpdater.latestNext = value;

		settingsAdditions.settings[setting] = value;

		logger.log("log", `Setting "${setting}" applied with value "${value}"`);
	}

	{ // Кнопка "Назад" в конце плейлиста
		const setting = SettingName.PreviousSeeking;

		const value = await getValueOrDefault<boolean>(setting, false);

		controlsUpdater.previousSeeking = value;

		settingsAdditions.settings[setting] = value;

		logger.log("log", `Setting "${setting}" applied with value "${value}"`);
	}

	{ // Уведомления о текущем играющем треке
		const setting = SettingName.NowPlayingNotify;

		const value = await getValueOrDefault<boolean>(setting, false);

		// TODO: handle whenever `value` and permissions are in conflict (notify user)
		const applied = notifications.toggleNotifications(value);

		settingsAdditions.settings[setting] = applied ? value : false;

		logger.log("log", `Setting "${setting}" applied with value "${value}"`);
	}

	{ // Время, через которое убираются уведомления
		const setting = SettingName.NowPlayingNotifyTime;

		const value = await getValueOrDefault<NotificationDismissTime>(
			setting, NotificationDismissTime.Auto,
		);

		notifications.dismissTime = value;

		settingsAdditions.settings[setting] = value;

		logger.log("log", `Setting "${setting}" applied with value "${value}"`);
	}

	{ // Текущая версия
		const setting = "lastInstalledVersion";

		const firstTime = "first__time";

		const value = await getValueOrDefault<string>(
			setting,
			firstTime,
		);

		if (value !== currentVersion) {
			const key = value === firstTime
				? "installed"
				: "updated";

			showNotify(getStringsMap()[key]);

			await setValue(setting, currentVersion);
		}
	}
}

/**
 * Вешает обработчик события изменения настроек
 */
function handleSettingsChange() {
	settingsAdditions.settingUpdated.on(async (setting, val) => {
		const { settings } = settingsAdditions;

		logger.log("log", "Setting changed", setting, val);

		switch (setting) {
			case SettingName.LatestNext: {
				const value = settings[setting];

				controlsUpdater.latestNext = value;

				await setValue(setting, value);
			} break;
			case SettingName.PreviousSeeking: {
				const value = settings[setting];

				controlsUpdater.previousSeeking = value;

				await setValue(setting, value);
			} break;
			case SettingName.NowPlayingNotifyTime: {
				const value = settings[setting];

				notifications.dismissTime = value;

				await setValue(setting, value);
			} break;
			case SettingName.NowPlayingNotify: {
				const value = settings[setting];

				const accepted = notifications.toggleNotifications(value);

				if (!accepted) break;

				await setValue(setting, value);
			} break;
			default: break;
		}

		switch (setting) {
			case SettingName.LatestNext:
			case SettingName.PreviousSeeking: {
				controlsUpdater.forceUpdate();
			} break;
			default: break;
		}
	});
}

handleSettingsChange();

/**
 * Завершает загрузку
 */
async function finishLoading() {
	await applySettings();

	tryDetectLocale();

	metadataUpdater.forceUpdate();

	navigation.bindEvents();

	settingsAdditions.bindEvents();
	settingsAdditions.forceUpdateState();

	logger.log("log", "PlayerEvent.Ready triggered");
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
if (isPlayerReady()) finishLoading();
else getExternalAPI().on(PlayerEvent.Ready, finishLoading);

metadataUpdater.bindEvents();
controlsUpdater.bindEvents();

logger.log("log", "Initialization complete");
