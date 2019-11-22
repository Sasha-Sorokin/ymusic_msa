import { PlayerEvent, IAdvert } from "@yandex/externalAPI";
import { getMediaSession, MediaSessionAction } from "@utils/mediaSession";
import { Logger } from "@utils/logger";
import { ExternalAPIBased } from "./externalAPIBased";

type BoundActionsMap = {
	[action in MediaSessionAction]: boolean;
};

const LOGGER = new Logger("ControlsUpdater");

/**
 * Граница в секундах до которой перемотка клавишей назад не работает
 */
const PREVIOUS_SEEKING_EDGE = 2;

export class ControlsUpdater extends ExternalAPIBased {
	constructor() {
		super();

		const mediaSession = getMediaSession();

		if (mediaSession == null) {
			throw new Error("MediaSession API is not supported in this browser.");
		} else if (mediaSession.setActionHandler == null) {
			throw new Error("MediaSession#setActionHandler is not supported in this browser.");
		}

		this._mediaSession = mediaSession;
	}

	/**
	 * Привязывает необходимые обработчики
	 */
	public bindEvents() {
		this._bindListener(
			PlayerEvent.ControlsChanged,
			() => this._onControlsChange(),
		);

		this._externalAPI.on(
			PlayerEvent.Advert,
			(advert) => this._onAdvert(advert),
		);
	}

	/**
	 * Принудительно обновляет состояние всех кнопок
	 */
	public forceUpdate() {
		this._onControlsChange();
	}

	/**
	 * Должна ли кнопка "Вперёд" быть включена в конце плейлистов
	 */
	public latestNext: boolean = true;

	/**
	 * Должна ли кнопка "Назад" перематывать в начало
	 */
	public previousSeeking: boolean = true;

	/**
	 * MediaSession API
	 */
	private readonly _mediaSession: MediaSession;

	/**
	 * Карта состояний привязки к действиям
	 */
	private readonly _boundActions: BoundActionsMap = Object.create(null);

	/**
	 * Переключается к прошлому треку или перематывает в начало в зависимости от настроек
	 */
	private _previous() {
		const externalAPI = this._externalAPI;

		const { position } = externalAPI.getProgress();

		if (this.previousSeeking && position > PREVIOUS_SEEKING_EDGE) {
			externalAPI.setPosition(0);

			return;
		}

		// При поведении с перемоткой, кнопка принудительно включается поэтому
		// будет совершенно не лишним проверить если прошлый трек имеется
		if (externalAPI.getPrevTrack() != null) this._externalAPI.prev();
	}

	/**
	 * Переключается на следующий трек или останавливает проигрывание
	 */
	private _nextOrStop() {
		const nextTrack = this._externalAPI.getNextTrack();

		if (nextTrack == null) {
			this._externalAPI.togglePause(true);
			this._externalAPI.setPosition(0);

			return;
		}

		this._externalAPI.next();
	}

	/**
	 * Проверяет если обработчик уже привязан к событию и его состояние не поменялось:
	 *
	 * Если кнопка становится доступна, но обработчик для него не привязан,
	 * запрашивает и вешает новый обработчик; в других же случаях убирает
	 * обработчик как более недоступный.
	 *
	 * @param isAvailable Включена ли кнопка
	 * @param relatedAction К какому действию относится эта кнопка
	 * @param getHandler Функция для получения нового обработчика
	 */
	private _checkHandler(
		isAvailable: boolean,
		relatedAction: MediaSessionAction,
		getHandler: () => MediaSessionActionHandler<MediaSessionActionDetails>,
	) {
		const bounds = this._boundActions;
		const isBound = bounds[relatedAction];

		if (isBound === isAvailable) return;

		try {
			this._mediaSession.setActionHandler(
				relatedAction,
				isAvailable ? getHandler() : null,
			);
		} catch (err) {
			// Chromium выкидывает расширения, если не поддерживает действие, мы можем
			// залогировать один раз, проверив если статус ещё никогда не присваивался
			if (isBound === undefined) {
				LOGGER.log("warn", `Action "${relatedAction}" is not supported in this browser.`);
			}
		}

		bounds[relatedAction] = isAvailable;
	}

	/**
	 * Метод, вызываемый после события изменения состояния кнопок
	 */
	private _onControlsChange() {
		const externalAPI = this._externalAPI;

		const contols = externalAPI.getControls();

		this._checkHandler(
			// eslint-disable-next-line
			(contols.next ?? false) || this.latestNext,
			MediaSessionAction.NextTrack,
			() => () => this._nextOrStop(),
		);

		this._checkHandler(
			// eslint-disable-next-line
			(contols.prev ?? false) || this.previousSeeking,
			MediaSessionAction.PreviousTrack,
			() => () => this._previous(),
		);

		this._checkHandler(
			true,
			MediaSessionAction.Pause,
			() => () => externalAPI.togglePause(true),
		);

		this._checkHandler(
			true,
			MediaSessionAction.Play,
			() => () => externalAPI.togglePause(false),
		);
	}

	/**
	 * Упрощённый метод, чтобы убирать обрабочики для действий,
	 * которые перестали быть доступны.
	 *
	 * @param action Действие, которое перестало быть доступным
	 */
	private _markUnavailable(action: MediaSessionAction) {
		try {
			this._mediaSession.setActionHandler(action, null);
		} catch {
			// LOGGER.log("warn", `Action "${action}" is not supported in this browser.`);
		}

		this._boundActions[action] = false;
	}

	/**
	 * Метод, вызываемый после события появления рекламы
	 *
	 * @param advert Объект объявления
	 */
	private _onAdvert(advert: IAdvert | false) {
		// ESLint отлично сыграл в этом случае, так как advert
		// никогда не бывает `true`, не имеет никакого смысла
		// делать что-то ещё, кроме как проверять его тип
		if (typeof advert === "boolean") {
			this._onControlsChange();

			return;
		}

		this._markUnavailable(MediaSessionAction.NextTrack);
		this._markUnavailable(MediaSessionAction.PreviousTrack);
		// TODO: проверить доступность кнопок проигрывания/паузы при рекламе
		// this._markUnavailable(MediaSessionAction.Play);
		// this._markUnavailable(MediaSessionAction.Pause);
	}
}
