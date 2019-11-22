import { exposeRepo, getInternalAPI } from "@yandex/internalAPI";

/**
 * Представляет собой объект, который может содержать обложку
 */
interface ICovered {
	/**
	 * Обложка объекта
	 */
	cover?: string;
}

/**
 * Представляет собой исполнителя
 */
export interface IArtist extends ICovered {
	/**
	 * Название исполнителя
	 */
	title: string;
	/**
	 * Ссылка на страницу исполнителя
	 */
	link: string;
}

/**
 * Представляет собой альбом
 */
export interface IAlbum extends ICovered {
	/**
	 * Название альбома
	 */
	title: string;
	/**
	 * Год выпуска
	 */
	year: number;
	/**
	 * Ссылка на страницу с альбомом
	 */
	link: string;
	/**
	 * Исполнители альбома
	 */
	artists: IArtist[];
}

/**
 * Представляет собой трек
 */
export interface ITrack extends ICovered {
	/**
	 * Название трека
	 */
	title: string;
	/**
	 * Ссылка на страницу трека в альбоме
	 */
	link: string;
	/**
	 * Длительность трека в секундах
	 */
	duration: number;
	/**
	 * Лайкнут ли трек пользователем
	 */
	liked: boolean;
	/**
	 * Дизлайкнут ли трек пользователем
	 */
	disliked: boolean;
	/**
	 * Исполнители трека
	 */
	artists?: IArtist[];
	/**
	 * Версия трека
	 */
	version?: string;
	/**
	 * Альбом с треком
	 */
	album?: IAlbum;
}

/**
 * Представляет собой плейлист
 */
export interface IPlaylist extends ICovered {
	/**
	 * Название плейлиста
	 */
	title: string;
	/**
	 * Владелец плейлиста
	 */
	owner: string;
	/**
	 * Ссылка на плейлист
	 */
	link: string;
}

/**
 * Представляет собой объявление
 */
export interface IAdvert {
	/**
	 * Название объявления
	 */
	title: string;
	/**
	 * Изображение объявления
	 */
	image: string;
	/**
	 * Ссылка, куда перенаправляет объявление
	 */
	link: string;
}

/**
 * Представляет собой источник проигрывания треков
 */
export interface ISourceInfo extends IPlaylist {
	type: "playlist" | "album" | "radio" | "common";
}

/**
 * Представляет собой объект состояние кнопок
 */
export interface IControls {
	/**
	 * Доступна ли кнопка плейлиста
	 */
	index?: boolean;
	/**
	 * Доступна ли кнопка дизлайка
	 */
	dislike?: boolean;
	/**
	 * Доступна ли кнопка добавление в избранное
	 */
	like?: boolean;
	/**
	 * Доступна ли кнопка "Вперёд"
	 */
	next?: boolean;
	/**
	 * Доступна ли кнопка "Назад"
	 */
	prev?: boolean;
	/**
	 * Доступна ли кнопка повтора
	 */
	repeat?: boolean;
	/**
	 * ДОступна ли кнопка случайного порядка
	 */
	shuffle?: boolean;
}

/**
 * Представляет собой значение, возвращаемое для трека на повторе
 */
type RepeatOne = 1;

/**
 * Представляет собой прогресс проигрывания
 */
interface IProgress {
	/**
	 * Длительность трека в секундах
	 */
	duration: number;
	/**
	 * Текущия проигрываемая позиция в секундах
	 */
	position: number;
	/**
	 * Количество загруженных секунд трека
	 */
	loaded: number;
}

/**
 * Представляет собой обработчик события рекламы
 */
type AdvertCallback = (advert: IAdvert | false) => void;

/**
 * Перечисление всех событий внешнего API
 */
export const enum PlayerEvent {
	/**
	 * Событие при начале или завершении проигрывания рекламы
	 */
	Advert = "advert",
	/**
	 * Событие при изменении доступности кнопок
	 */
	ControlsChanged = "controls",
	/**
	 * Событие прогресса проигрывания трека
	 */
	Progress = "progress",
	/**
	 * Событие готовности внешнего API
	 */
	Ready = "ready",
	/**
	 * Событие изменения источника проигрывания
	 */
	SourceInfo = "info",
	/**
	 * Событие изменения скорости проигрывания
	 */
	SpeedChanged = "speed",
	/**
	 * Событие изменения состояния проигрывания
	 */
	StateChanged = "state",
	/**
	 * Событие изменения текущего трека
	 */
	CurrentTrack = "track",
	/**
	 * Событие изменения очереди проигрывания
	 */
	TracksList = "tracks",
	/**
	 * Событие изменения громкости
	 */
	VolumeChanged = "volume",
	/**
	 * Событие остановки из-за превышения ограничения прослушивания в фоне
	 *
	 * **Это событие вызывается исключительно этим скриптом**
	 */
	CrackdownPause = "crackdownPause",
}

/**
 * Представляет собой только те события, обработчики которых не должны содержать параметров
 */
export type ClearPlayerEvent = Exclude<PlayerEvent, PlayerEvent.Advert>;

/**
 * Представляет собой объект внешнего API
 */
export interface IExternalAPI {
	/**
	 * Возвращает текущий играющий трек
	 */
	getCurrentTrack(): ITrack | null;
	/**
	 * Возвращает следующий трек
	 */
	getNextTrack(): ITrack | null;
	/**
	 * Возвращает прошлый трек
	 */
	getPrevTrack(): ITrack | null;
	/**
	 * Возвращает очередь воспроизведения
	 */
	getTracksList(): ITrack[];
	/**
	 * Возвращает источник
	 */
	getSourceInfo(): ISourceInfo;
	/**
	 * Играет ли плеер прямо сейчас
	 *
	 * @returns `false` если на паузе, иначе `true`
	 */
	isPlaying(): boolean;
	/**
	 * Возвращает доступные элементы управления
	 */
	getControls(): IControls;
	/**
	 * Включён ли режим перемешки
	 *
	 * @returns `false` если перемешка выключена, иначе `true`
	 */
	getShuffle(): boolean;
	/**
	 * Включён ли режим повтора
	 *
	 * @returns `false` если выключен, `1` если повторяется только текущий трек,
	 *  в других случаях `true`
	 */
	getRepeat(): boolean | RepeatOne;
	/**
	 * Возвращает текущую громкость
	 */
	getVolume(): number;
	/**
	 * Возвращает текущую скорость воспроизведения
	 */
	getSpeed(): number;
	/**
	 * Возвращает текущий прогресс проигрывания
	 */
	getProgress(): IProgress;
	/**
	 * Возобновляет воспроизведение или, если предоставлен `index`,
	 * переключается на трек по данному индексу
	 *
	 * @param index Индекс трека в плейлисте
	 */
	play(index?: number): void;
	/**
	 * Переключается на следующий трек
	 */
	next(): void;
	/**
	 * Переключается на предыдущий трек
	 */
	prev(): void;
	/**
	 * Ставит воспроизведение на паузу
	 *
	 * @param state Булевое значение, если плеер стоит на паузе
	 */
	togglePause(state: boolean): void;
	/**
	 * Добавляет текущий трек в избранное
	 */
	toggleLike(): void;
	/**
	 * Ставит дилзлайк для текущего трека и убирает из избранного
	 */
	toggleDislike(): void;
	/**
	 * Устанавливает режим перемешки
	 *
	 * @param state Состояние режима перемешки
	 */
	toggleShuffle(state: boolean): void;
	/**
	 * Устанавливает режим повтора
	 *
	 * @param state Состояние режима повтора
	 */
	toggleRepeat(state: boolean | RepeatOne): void;
	/**
	 * Устанавливает текущую громкость
	 *
	 * @param value Новый уровень громкости от 0 до 100
	 */
	setVolume(value: number): void;
	/**
	 * Устанавливает скорость воспроизведения
	 *
	 * @param value Новая скорость воспроизведения
	 */
	setSpeed(value: number): void;
	/**
	 * Переключает режим заглушения
	 *
	 * @param state Новый режим заглушения
	 */
	toggleMute(state: boolean): void;
	/**
	 * Перематывает в указанную позицию
	 *
	 * @param value Позиция для перемотки в секундах
	 */
	setPosition(value: number): void;

	/**
	 * Вешает обработчик для события
	 *
	 * @param event Событие для которого вызывается обработчик
	 * @param callback Обработчик при срабатывании события
	 */
	on(event: PlayerEvent.Advert, callback: AdvertCallback): void;
	on(event: ClearPlayerEvent, callback: () => void): void;

	/**
	 * Убирает обработчик с события
	 *
	 * @param event Событие для которого был добавлен обработчик
	 * @param callback Обработчик, который необходимо убрать
	 */
	off(event: PlayerEvent.Advert, callback: AdvertCallback): void;
	off(event: ClearPlayerEvent, callback: () => void): void;

	/**
	 * Переходит к странице по указанному URL
	 *
	 * @param url URL к которому необходимо перейти
	 */
	navigate(url: string): void;

	/**
	 * В буквальном смысле заспамливает консоль полезнейшей информацией о внешнем API
	 */
	help(): void;

	/**
	 * Вызывает событие
	 *
	 * @param event Событие которое сработало
	 */
	trigger(event: ClearPlayerEvent): void;
}

declare global {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Window {
		externalAPI: IExternalAPI;
	}
}

/**
 * Привязаны ли дополнительные обработчики для срабатывания наших событий
 */
let additionalTriggersBound = false;

/**
 * Привязывает дополнительные обработчики для срабатывания наших событий
 *
 * @param externalAPI Внешнее API к которому выполняется привязка
 */
function bindAdditionalTriggers(externalAPI: IExternalAPI) {
	if (additionalTriggersBound) return;

	exposeRepo().adapter.on(
		getInternalAPI().Adapter.CRACKDOWN_PAUSE,
		() => externalAPI.trigger(PlayerEvent.CrackdownPause),
	);

	additionalTriggersBound = true;
}

/**
 * Возвращает внешнее API Яндекс.Музыки
 *
 * @returns Внешнее API Яндекс.Музыки
 */
export function getExternalAPI() {
	const { externalAPI } = unsafeWindow;

	if (externalAPI == null) {
		throw new Error("External API is not available.");
	}

	if (!additionalTriggersBound) bindAdditionalTriggers(externalAPI);

	return externalAPI;
}

/**
 * Перечисление размеров обложек
 */
export const enum CoverSize {
	"30x30" = "30x30",
	"50x50" = "50x50",
	"80x80" = "80x80",
	"100x100" = "100x100",
	"200x200" = "200x200",
	"300x300" = "300x300",
	"400x400" = "400x400",
}

/**
 * Возвращает ссылку на обложку объекта нужного размера
 *
 * @param obj Объект, ссылку на обложку которого нужно получить
 * @param size Размер обложки
 * @returns Ссылка на обложку
 */
export function getCoverURL(obj: ICovered, size: CoverSize): string | null {
	const coverLink = obj.cover?.replace("%%", size);

	return coverLink != null ? `https://${coverLink}` : null;
}

/**
 * Проверяет готовность плеера
 *
 * @returns `true` если плеер готов
 */
export function isPlayerReady() {
	return exposeRepo().player.isReady();
}
