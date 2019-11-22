import { NotificationDismissTime } from "@common/enums";
import * as ruRU from "./ru-RU.yml";
import * as enGB from "./en-GB.yml";

interface IDescribedSetting {
	title: string;
	description: string;
}

interface IToggleState {
	on: string;
	off: string;
}

export interface ILocale {
	mediaKeys: IDescribedSetting;
	previousSeeking: IDescribedSetting;
	latestNext: IDescribedSetting;
	nowPlayingHeader: string;
	notifications: IDescribedSetting;
	notificationsDismiss: IDescribedSetting;
	notificationsDismissTime: {
		[K in NotificationDismissTime]: string;
	};
	toggleState: IToggleState;
	advert: {
		notification: string;
	};
	crackdown: {
		notification: string;
	};
	installed: string;
	updated: {
		body: string;
		link: string;
	};
}

export interface ILocaleMap {
	[locale: string]: ILocale | undefined;
}

export const Locales: ILocaleMap = {
	"en-GB": <ILocale> enGB,
	"ru-RU": <ILocale> ruRU,
};
