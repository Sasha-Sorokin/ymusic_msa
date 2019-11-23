import { PlayerEvent, getCoverURL, CoverSize, IAdvert } from "@yandex/externalAPI";
import { getAppString, getStringsMap } from "@utils/i18n";
import { NotificationDismissTime } from "@common/enums";
import { Logger } from "@utils/logger";
import { ExternalAPIBased } from "./externalAPIBased";

const LOGGER = new Logger("Notifications");

/**
 * Сконвертированные интервалы закрытия обновлений
 */
const DISMISS_TIMES: { [O in NotificationDismissTime]: number } = {
	[NotificationDismissTime.Auto]: -1,
	[NotificationDismissTime["3s"]]: 3000,
	[NotificationDismissTime["5s"]]: 5000,
};

/**
 * Контроллер отвечающий за отправку уведомлений о текущем играющем треке
 */
export class NowPlayingNotifications extends ExternalAPIBased {
	/**
	 * Текущия опция времени закрытия уведомлений
	 */
	public dismissTime: NotificationDismissTime = NotificationDismissTime.Auto;

	/**
	 * Включены ли уведомления
	 */
	private _notificationsEnabled: boolean = false;

	/**
	 * Проверяет возможность отправки уведомлений и переключает их статус
	 *
	 * @param value Должны ли быть уведомления включены
	 * @returns Булевое значение успешности переключения: переключение может
	 * быть "безуспешно" если пользователь не дал разрешений отправку уведомлений
	 */
	public toggleNotifications(value: boolean): boolean {
		if (this._notificationsEnabled === value) return true;

		if (!value) {
			this._notificationsEnabled = false;

			this._unbindEvents();

			LOGGER.log("log", "Notifications were disabled");

			return true;
		}

		if (Notification.permission !== "granted") return false;

		this._notificationsEnabled = true;

		this._bindEvents();

		LOGGER.log("log", "Notifications were enabled");

		return true;
	}

	/**
	 * Текущий привязанный обработчик для события переключения трека
	 */
	private _boundEventCallback?: () => void;

	/**
	 * Текущий привязанный обработчик для событий рекламы
	 */
	private _boundAdEventCallback?: (advert: IAdvert | false) => void;

	/**
	 * Текущий привязанный обработчик для события долгого прослушивания в фоне
	 */
	private _boundCrackdownEventCallback?: () => void;

	/**
	 * Привязывает необходимые обработчики
	 *
	 * @returns Булевое значение, сообщающее было ли привязано какое-либо событие
	 */
	private _bindEvents() {
		let anyBound = false;

		if (this._boundEventCallback == null) {
			const eventCallback = () => this._onTrackChange();

			this._externalAPI.on(
				PlayerEvent.CurrentTrack,
				eventCallback,
			);

			this._boundEventCallback = eventCallback;

			anyBound = true;
		}

		if (this._boundAdEventCallback == null) {
			const eventCallback = (advert: IAdvert | false) => this._onAdvert(advert);

			this._externalAPI.on(
				PlayerEvent.Advert,
				eventCallback,
			);

			this._boundAdEventCallback = eventCallback;

			anyBound = true;
		}

		if (this._boundCrackdownEventCallback == null) {
			const eventCallback = () => this._onCrackdown();

			this._externalAPI.on(
				PlayerEvent.CrackdownPause,
				eventCallback,
			);

			this._boundCrackdownEventCallback = eventCallback;

			anyBound = true;
		}

		return anyBound;
	}

	/**
	 * Отвязывает ранее привязанные обработчики
	 *
	 * @returns Булевое значение, сообщающее было ли отвязано какое-либо событие
	 */
	private _unbindEvents() {
		let anyUnbound = false;

		const defaultCallback = this._boundEventCallback;
		const adCallback = this._boundAdEventCallback;
		const crackdownCallback = this._boundCrackdownEventCallback;

		if (defaultCallback != null) {
			this._externalAPI.off(PlayerEvent.CurrentTrack, defaultCallback);

			this._boundEventCallback = undefined;

			anyUnbound = true;
		}

		if (adCallback != null) {
			this._externalAPI.off(PlayerEvent.Advert, adCallback);

			this._boundAdEventCallback = undefined;

			anyUnbound = true;
		}

		if (crackdownCallback != null) {
			this._externalAPI.off(PlayerEvent.CrackdownPause, crackdownCallback);

			this._boundCrackdownEventCallback = undefined;

			anyUnbound = true;
		}

		return anyUnbound;
	}

	/**
	 * Создаёт новое уведомление, устанавливает таймер его закрытия
	 * и привязывает обработчик клика для возврата фокуса вкладке
	 *
	 * По умолчанию в опциях уже идёт тег и настройка тишины, так
	 * что назначать их повторно не имеет смысла.
	 *
	 * @param title Заголовок уведомления
	 * @param options Дополнительные опции для уведомления
	 * @param dismiss Нужно ли автоматически убирать уведомление
	 * @returns Созданное уведомление
	 */
	private _createNotification(title: string, options: NotificationOptions, dismiss = true) {
		const notification = new Notification(title, {
			tag: "yamumsa--nowplaying",
			silent: true,
			...options,
		});

		if (dismiss) {
			const dismissAfter = DISMISS_TIMES[this.dismissTime];

			if (dismissAfter > 0) {
				setTimeout(() => notification.close(), dismissAfter);
			}
		}

		notification.addEventListener("click", () => {
			unsafeWindow.focus();
			unsafeWindow.parent.focus();
		});

		return notification;
	}

	/**
	 * Метод вызываемый после события изменения трека
	 */
	private _onTrackChange() {
		const currentTrack = this._externalAPI.getCurrentTrack();

		// Мы могли бы использовать новомодное API видимости вкладки, но
		// к сожалению, оно не берёт во внимание переключение пользователя
		// на любое другое приложение. document.hasFocus отрабатывает отлично
		if (currentTrack == null || document.hasFocus()) return;

		let body = "";

		if (currentTrack.artists != null) {
			body += `${currentTrack.artists[0]?.title}\n`;
		}

		const source = this._externalAPI.getSourceInfo().title;
		const service = getAppString("meta", "Яндекс.Музыка");

		body += `${source} · ${service}`;

		this._createNotification(currentTrack.title, {
			// eslint-disable-next-line
			icon: getCoverURL(currentTrack, CoverSize["200x200"]) ?? undefined,
			body,
		});
	}

	/**
	 * Прошлое уведомление для рекламы
	 */
	private _previousAdNotification?: Notification;

	/**
	 * Метод вызываемый после события начала/окончания рекламы
	 *
	 * @param advert Объявление играющее в данный момент
	 */
	private _onAdvert(advert: IAdvert | false) {
		// Всегда принудительно закрываем прошлое уведомление с рекламой,
		// иногда пользователь может перейти ко вкладке и мы не станем
		if (this._previousAdNotification != null) {
			this._previousAdNotification.close();

			this._previousAdNotification = undefined;
		}

		if (typeof advert === "boolean" || document.hasFocus()) return;

		const ad = getAppString("audio-advert", "Реклама");
		const service = getAppString("meta", "Яндекс.Музыка");

		const isTitled = advert.title != null;

		const label = `${ad} ${isTitled ? "·" : "—"} ${service}`;

		let body = isTitled ? `${label}\n` : "";
		body += getStringsMap().advert.notification;

		const options: NotificationOptions = {
			image: advert.image,
			body,
		};

		this._previousAdNotification = this._createNotification(
			isTitled ? advert.title! : label,
			options,
			false, // Стараемся удержать уведомление максимально подольше
		);
	}

	/**
	 * Метод вызываемый после события остановки из-за длительного прослушивания в фоне
	 */
	private _onCrackdown() {
		if (document.hasFocus()) return;

		const body = getAppString(
			"crackdown-popup",
			"[feature/crackdown-test]Бесплатно слушать музыку в фоновом режиме можно только 30 минут. Оформите подписку, и музыку ничего не остановит.",
		);

		const service = getAppString("meta", "Яндекс.Музыка");

		const title = getStringsMap().crackdown.notification;

		this._createNotification(`${title} — ${service}`, {
			// Это самая лучшая и подходящая иконка, которую я смог откопать
			icon: "https://music.yandex.ru/blocks/common/badge.music.png",
			body,
			silent: false,
		}, false);
	}
}
