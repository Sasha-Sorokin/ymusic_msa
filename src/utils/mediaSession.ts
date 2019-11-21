export const enum MediaSessionAction {
	Play = "play",
	Pause = "pause",
	Stop = "stop",
	SeekBackward = "seekbackward",
	SeekForward = "seekforward",
	SeekTo = "seekto",
	PreviousTrack = "previoustrack",
	NextTrack = "nexttrack",
	SkipAd = "skipad",
}

export const enum MediaSessionPlaybackState {
	None = "none",
	Paused = "paused",
	Playing = "playing",
}

type SeekAction = MediaSessionAction.SeekBackward | MediaSessionAction.SeekForward;

declare global {
	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaSessionActionDetails {
		action: MediaSessionAction;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaSessionSeekActionDetails extends MediaSessionActionDetails {
		/**
		 * Time in seconds to move the playback time by
		 */
		seekOffset?: number;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaSessionSeekToActionDetails extends MediaSessionActionDetails {
		/**
		 * Time in seconds to move the playback time to
		 */
		seekTime: number;
		/**
		 * Will be `true` if the `seekto` action is being called multiple times
		 * as part of a sequence and this is not the last call in that sequence
		 */
		fastSeek?: boolean;
	}

	type MediaSessionActionHandler<T extends MediaSessionActionDetails> = (details: T) => void;

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaImage {
		src: string;
		sizes?: string;
		type?: string;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaMetadataInit {
		title: string;
		artist: string;
		album: string;
		artwork: MediaImage[];
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaMetadata {
		title: string;
		artist: string;
		album: string;
		artwork: MediaImage[];
	}

	const MediaMetadata: {
		prototype: MediaMetadata;
		new(init?: Partial<MediaMetadataInit>): MediaMetadata;
	};

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaSessionState {
		duration?: number;
		playbackRate?: number;
		position?: number;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface MediaSession {
		metadata?: MediaMetadata;
		playbackState?: MediaSessionPlaybackState;
		setActionHandler(
			type: SeekAction,
			handler: MediaSessionActionHandler<MediaSessionSeekActionDetails> | null,
		): void;
		setActionHandler(
			type: MediaSessionAction.SeekTo,
			handler: MediaSessionActionHandler<MediaSessionSeekToActionDetails> | null,
		): void;
		setActionHandler(
			type: MediaSessionAction,
			handler: MediaSessionActionHandler<MediaSessionActionDetails> | null,
		): void;
		setPositionState?(
			state?: MediaSessionState,
		): void;
	}

	// eslint-disable-next-line @typescript-eslint/interface-name-prefix
	interface Navigator {
		mediaSession?: MediaSession;
	}
}

/**
 * Возвращает интерфейс медиа-сессии, если доступно
 *
 * @returns Интерфейс медиа-сессии
 */
export function getMediaSession() {
	return navigator.mediaSession;
}
