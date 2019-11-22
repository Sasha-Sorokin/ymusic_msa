import { PlayerEvent, ITrack, CoverSize, getCoverURL } from "@yandex/externalAPI";
import { getMediaSession, MediaSessionPlaybackState } from "@utils/mediaSession";

import { default as throttle } from "throttleit";
import { ExternalAPIBased } from "./externalAPIBased";

/**
 * Размеры каверов, которые будут использоваться в качестве артворков MSA
 */
const ARTWORKS_SIZES = [
	CoverSize["80x80"],
	CoverSize["200x200"],
	CoverSize["400x400"],
];

/**
 * Интвервал для троттлинга обновлений прогресса в MSA
 */
const PROGRESS_UPDATE_TIME = 1000; // мс

/**
 * Обновляет метаданные и прогресс в MSA
 */
export class MetadataUpdater extends ExternalAPIBased {
	constructor() {
		super();

		const mediaSession = getMediaSession();

		if (mediaSession == null) {
			throw new Error("MediaSession API is not supported in this browser.");
		}

		this._mediaSession = mediaSession;
	}

	/**
	 * Привязывает необходимые события к внешнему API
	 */
	public bindEvents() {
		this._bindListener(
			PlayerEvent.CurrentTrack,
			() => this._onCurrentTrack(),
		);

		if (this._mediaSession.setPositionState != null) {
			// Яндекс.Музыка сообщает о прогрессе каждые ~500 мс,
			// не имеет смысла так часто рапортавать об этом MSA,
			// поэтому троттлим вызовы на интервал заданный константой
			const onProgress = throttle(
				() => this._onProgress(),
				PROGRESS_UPDATE_TIME,
			);

			this._bindListener(
				PlayerEvent.Progress,
				onProgress,
			);
		}

		this._bindListener(
			PlayerEvent.StateChanged,
			() => this._onStateChange(),
		);
	}

	/**
	 * Принудительно вызывает методы обновления метаданных
	 */
	public forceUpdate() {
		this._onCurrentTrack();
		this._onStateChange();
		this._onProgress();
	}

	/**
	 * MediaSession API
	 */
	private readonly _mediaSession: MediaSession;

	/**
	 * Преобразует треки формата внешнего API в формат `MediaMetadata`
	 *
	 * @param track Трек для преобразования
	 * @returns Объект метаданных для MSA
	 */
	private _convertToMetadata(track: ITrack) {
		const artworks: MediaImage[] = [];

		if (track.cover != null) {
			for (const size of ARTWORKS_SIZES) {
				const url = getCoverURL(track, size);

				if (url == null) continue;

				artworks.push({
					src: url,
					sizes: size,
				});
			}
		}

		return new MediaMetadata({
			artist: track.artists?.[0].title,
			title: track.title,
			album: track.album?.title,
			artwork: artworks,
		});
	}

	/**
	 * Метод вызываемый после события изменения трека
	 */
	private _onCurrentTrack() {
		const currentTrack = this._externalAPI.getCurrentTrack();

		if (currentTrack == null) {
			this._mediaSession.metadata = undefined;

			return;
		}

		this._mediaSession.metadata = this._convertToMetadata(currentTrack);
	}

	/**
	 * Последняя отрапортованная скорость проигрывания треков
	 */
	private _currentPlaybackRate?: number;

	/**
	 * Метод вызываемый после события изменения скорости проигрывания
	 */
	private _onProgress() {
		const externalAPI = this._externalAPI;

		const progress = externalAPI.getProgress();

		let playbackRate = this._currentPlaybackRate;

		if (playbackRate == null) {
			playbackRate = externalAPI.getSpeed();

			this._currentPlaybackRate = playbackRate;
		}

		// eslint-disable-next-line @typescript-eslint/unbound-method
		this._mediaSession.setPositionState?.({
			duration: progress.duration,
			position: progress.position,
			playbackRate: this._currentPlaybackRate,
		});
	}

	/**
	 * Метод вызываемый после события изменения состояния проигрывания
	 */
	private _onStateChange() {
		const currentTrack = this._externalAPI.getCurrentTrack();

		if (currentTrack == null) {
			this._mediaSession.playbackState = MediaSessionPlaybackState.None;

			return;
		}

		const isPlaying = this._externalAPI.isPlaying();

		this._mediaSession.playbackState = isPlaying
			? MediaSessionPlaybackState.Playing
			: MediaSessionPlaybackState.Paused;
	}
}
