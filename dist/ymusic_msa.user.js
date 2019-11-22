//
// ==UserScript==
// @name Yandex Music MSA Integration
// @name:ru Интеграция MSA для Яндекс Музыки
// @description Integrates Yandex Music with MediaSession API
// @description:ru Интегрирует Яндекс Музыку с API MediaSession
// @version 1.0.4
// @author Sasha Sorokin https://github.com/Sasha-Sorokin
// @license MIT
//
// @namespace https://github.com/Sasha-Sorokin/ymusic_msa/
// @homepage https://github.com/Sasha-Sorokin/ymusic_msa/
// @supportURL https://github.com/Sasha-Sorokin/ymusic_msa/issues/
// @updateURL https://raw.githubusercontent.com/Sasha-Sorokin/ymusic_msa/master/dist/ymusic_msa.user.js
// @grant GM.notification
// @grant GM_notification
// @grant GM.setValue
// @grant GM_setValue
// @grant GM.getValue
// @grant GM_getValue
// @include https://music.yandex.ru/*
// @run-at document-end
// @noframes
// ==/UserScript==
//

(function () {
    'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    const $LOGGER_NAME = Symbol("loggerName");
    const $BASE_NAME = Symbol("baseLoggerName");
    /**
     * Представляет собой "журнал", в который записываются полезные (и нет) данные
     */
    class Logger {
        /**
         * Создаёт новый лог
         *
         * @param loggerName Название этого отдельного лога
         */
        constructor(loggerName) {
            this[$LOGGER_NAME] = `[${loggerName}]`;
        }
        /**
         * Создаёт новую запись в логе
         *
         * @param verbosity Тип записи в логе
         * @param args Аргументы для записи в лог
         */
        log(verbosity, ...args) {
            const log = console[verbosity];
            const baseName = Logger[$BASE_NAME];
            if (baseName != null) {
                log(baseName, this[$LOGGER_NAME], ...args);
            }
            else {
                log(this[$LOGGER_NAME], ...args);
            }
        }
        /**
         * Создаёт новую запись в логе, а затем выводит стек вызовов
         *
         * @param verbosity Тип записи в логе
         * @param args Аргументы для записи в лог
         */
        trace(verbosity, ...args) {
            this.log(verbosity, ...args);
            console.trace();
        }
        /**
         * Устанавливает префикс для записей в общий лог,
         * он будет отображаться перед самой записью
         *
         * @param baseName Префикс для записей в общий лог
         */
        static setBaseName(baseName) {
            Logger[$BASE_NAME] = `[${baseName}]`;
        }
    }

    /**
     * Возвращает глобальный объект Mu
     *
     * @throws {Error} Если объект Mu не объявлен
     * @returns Глобальный объект Mu
     */
    function getInternalAPI() {
        const mu = unsafeWindow.Mu;
        if (mu == null) {
            throw new Error("Mu is not available.");
        }
        return mu;
    }
    /**
     * Возвращает репозиторий общих модулей
     *
     * @throws {Error} Если репозиторий недоступен
     * @returns Репозиторий общих модулей
     */
    function exposeRepo() {
        var _a, _b, _c;
        const repo = (_c = (_b = (_a = unsafeWindow.Mu) === null || _a === void 0 ? void 0 : _a.blocks) === null || _b === void 0 ? void 0 : _b.di) === null || _c === void 0 ? void 0 : _c.repo;
        if (repo == null) {
            throw new Error("Repo is not available.");
        }
        return repo;
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
    function bindAdditionalTriggers(externalAPI) {
        if (additionalTriggersBound)
            return;
        exposeRepo().adapter.on(getInternalAPI().Adapter.CRACKDOWN_PAUSE, () => externalAPI.trigger("crackdownPause" /* CrackdownPause */));
        additionalTriggersBound = true;
    }
    /**
     * Возвращает внешнее API Яндекс.Музыки
     *
     * @returns Внешнее API Яндекс.Музыки
     */
    function getExternalAPI() {
        const { externalAPI } = unsafeWindow;
        if (externalAPI == null) {
            throw new Error("External API is not available.");
        }
        if (!additionalTriggersBound)
            bindAdditionalTriggers(externalAPI);
        return externalAPI;
    }
    /**
     * Возвращает ссылку на обложку объекта нужного размера
     *
     * @param obj Объект, ссылку на обложку которого нужно получить
     * @param size Размер обложки
     * @returns Ссылка на обложку
     */
    function getCoverURL(obj, size) {
        var _a;
        const coverLink = (_a = obj.cover) === null || _a === void 0 ? void 0 : _a.replace("%%", size);
        return coverLink != null ? `https://${coverLink}` : null;
    }
    /**
     * Проверяет готовность плеера
     *
     * @returns `true` если плеер готов
     */
    function isPlayerReady() {
        return exposeRepo().player.isReady();
    }

    /**
     * Слабая карта когда-либо созданных слушателей для быстрого доступа
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const LISTENERS_MAP = new WeakMap();
    /**
     * Представляет собой какое-то событие для объекта `T`, которое принимает обработчики `D`
     */
    class Event {
        constructor() {
            this._listeners = new Set();
        }
        /**
         * Создаёт "слушателя" для данного события
         *
         * @param callback Обработчик, вызываемый по происхождению события
         * @param persistent Булевое значение определяющее постоянство "слушателя"
         * @returns Созданный "слушатель"
         */
        _createListener(callback, persistent) {
            const listener = {
                callback,
                persistent,
            };
            LISTENERS_MAP.set(callback, listener);
            this._listeners.add(listener);
            return listener;
        }
        /**
         * Привязывает обработчик к данному событию
         *
         * @param callback Обработчик, вызываемый по происхождению этого события
         * @returns Этот же объект события для цепочных вызовов
         */
        on(callback) {
            this._createListener(callback, true);
            return this;
        }
        /**
         * Привязывает единоразовый обработчик к данному событию
         *
         * @param callback Обработчик, единожды вызываемый по происхождению этого события
         * @returns Этот же объект события для цепочных вызовов
         */
        once(callback) {
            this._createListener(callback, false);
            return this;
        }
        /**
         * Убирает обработчик для данного события
         *
         * @param callback Обработчик добавленный ранее
         * @returns Этот же объект события для цепочных вызовов
         */
        off(callback) {
            const listener = LISTENERS_MAP.get(callback);
            if (listener != null) {
                this._listeners.delete(listener);
                LISTENERS_MAP.delete(callback);
            }
            return this;
        }
        /**
         * Вызывает все обработчики этого события
         *
         * @param thisArg Объект, для которого произошло событие
         * @param args Аргументы для обработчиков данного события
         */
        _trigger(thisArg, args) {
            const listeners = this._listeners;
            for (const listener of listeners) {
                listener.callback.apply(thisArg, args);
                if (!listener.persistent)
                    listeners.delete(listener);
            }
        }
        /**
         * Создаёт новый объект события
         *
         * @returns Кортеж из объекта события и функции для вызова события
         */
        static create() {
            const event = new Event();
            // eslint-disable-next-line no-underscore-dangle
            const trigger = (eventOwner, ...args) => event._trigger(eventOwner, args);
            return [event, trigger];
        }
    }

    /**
     * Карта обработчиков навигации по определённым шаблонам
     */
    const templateListeners = new Map();
    const logger = new Logger("NavigationInterceptor");
    const [navigated, triggerNavigated] = Event.create();
    const [navigatedAway, triggerNavigatedAway] = Event.create();
    /**
     * Событие, происходящее при навигации пользователем на новую страницу
     *
     * Срабатывает с данными о новой (загруженной) страницы
     */
    const navigatedEvent = navigated;
    let loadedCallbackPushed = false;
    let unloadedCallbackPushed = false;
    /**
     * Возвращает текущий модуль страниц
     *
     * @throws {Error} Если модуль страниц недоступен
     * @returns Модуль страниц
     */
    function getModule() {
        const module = unsafeWindow.Mu.pages;
        if (module == null) {
            throw new Error("Pages module is not available.");
        }
        return module;
    }
    /**
     * Вешает наш обработчик к модулю страниц, чтобы вызывать событие выгрузки
     */
    function pushUnloadCallback() {
        if (unloadedCallbackPushed) {
            throw new Error("Pre-navigation callback is already pushed.");
        }
        getModule().on("unloaded" /* Unloaded */, (data) => {
            triggerNavigatedAway(null, data);
        });
        unloadedCallbackPushed = true;
    }
    /**
     * Вызывает обработчики после перехода на новую страницу
     *
     * @param data Данные текущей страницы
     */
    function postNavigation(data) {
        const { templateName } = data;
        if (templateName == null) {
            logger.trace("warn", "Called postNavigation with no path");
            return;
        }
        const listeners = templateListeners.get(templateName);
        if (listeners == null)
            return;
        for (const callback of listeners)
            callback(data);
    }
    /**
     * Вешает наш обработчик к модулю страниц, чтобы вызывать событие навигации
     */
    function pushLoadedCallback() {
        if (loadedCallbackPushed) {
            throw new Error("Post-navigation callback is already pushed.");
        }
        getModule().on("loaded" /* Loaded */, (data) => {
            triggerNavigated(null, data);
            postNavigation(data);
        });
        loadedCallbackPushed = true;
    }
    /**
     * Вешает обработчик, срабатывающий при навигации на страницу с указанным шаблоном
     *
     * @param templateName Название шаблона для которого вызывается обработчик
     * @param callback Обработчик, вызываемый с данными новой страницы
     */
    function onNavigationTo(templateName, callback) {
        let bindings = templateListeners.get(templateName);
        if (bindings == null) {
            bindings = new Set();
            templateListeners.set(templateName, bindings);
        }
        bindings.add(callback);
    }
    /**
     * Получает данные текущей страницы
     *
     * @returns Данные текущей страницы или `null`
     */
    function getCurrentPageData() {
        var _a;
        // eslint-disable-next-line
        return _a = (getModule().current), (_a !== null && _a !== void 0 ? _a : null);
    }
    /**
     * Проверяет готовность модуля страницы
     *
     * @returns Булевое значение готовности модуля страниц
     */
    function isReady() {
        var _a, _b;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        return _b = (((_a = unsafeWindow.Mu) === null || _a === void 0 ? void 0 : _a.pages) != null), (_b !== null && _b !== void 0 ? _b : false);
    }
    /**
     * Ожидаются или добавлены ли уже наши обработчики
     */
    let eventsPending = false;
    /**
     * Вешает обработчики или откладывает их до момента когда внешнее API сообщит о готовности
     *
     * @throws {Error} Если обработчики уже ожидают добавления или добавлены
     * @throws {Error} Если внешнее API недоступно (слишком ранний вызов)
     */
    function bindEvents() {
        if (eventsPending) {
            throw new Error("Events are already pending binding or bound.");
        }
        const bind = () => {
            pushLoadedCallback();
            pushUnloadCallback();
        };
        if (isReady())
            bind();
        else
            getExternalAPI().on("ready" /* Ready */, bind);
        eventsPending = true;
    }

    var data = { mediaKeys:{ title:"Управление медиа-клавишами",
        description:"Здесь вы можете изменить поведение медиа-клавиш." },
      previousSeeking:{ title:"«Прошлый трек» перематывает в начало",
        description:"Медиа-клавиша «прошлый трек» будет перематывать в начало, если трек играл более двух секунд." },
      latestNext:{ title:"Не отключать «следующий трек» в конце плейлиста",
        description:"Медиа-клавиша «следующий трек» будет использоваться для остановки в конце плейлиста." },
      nowPlayingHeader:"Уведомления об играющих треках",
      notifications:{ title:"Включить уведомления",
        description:"При проигрывании музыки в фоне, показывать уведомления о текущем треке." },
      notificationsDismiss:{ title:"Закрытие уведомлений",
        description:"Некоторые браузеры автоматически закрывают уведомления, некоторые нет." },
      notificationsDismissTime:{ "3s":"Спустя 3 секунды",
        "5s":"Спустя 5 секунд",
        auto:"Автоматически" },
      toggleState:{ on:"Вкл",
        off:"Выкл" },
      advert:{ notification:"Оформите подписку, чтобы слушать музыку без рекламы." },
      crackdown:{ notification:"Музыка остановлена" },
      installed:"Расширение интеграции с MSA установлено",
      updated:"Расширение интеграции с MSA обновилось" };
    var mediaKeys = data.mediaKeys;
    var previousSeeking = data.previousSeeking;
    var latestNext = data.latestNext;
    var nowPlayingHeader = data.nowPlayingHeader;
    var notifications = data.notifications;
    var notificationsDismiss = data.notificationsDismiss;
    var notificationsDismissTime = data.notificationsDismissTime;
    var toggleState = data.toggleState;
    var advert = data.advert;
    var crackdown = data.crackdown;
    var installed = data.installed;
    var updated = data.updated;

    var ruRU = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': data,
        mediaKeys: mediaKeys,
        previousSeeking: previousSeeking,
        latestNext: latestNext,
        nowPlayingHeader: nowPlayingHeader,
        notifications: notifications,
        notificationsDismiss: notificationsDismiss,
        notificationsDismissTime: notificationsDismissTime,
        toggleState: toggleState,
        advert: advert,
        crackdown: crackdown,
        installed: installed,
        updated: updated
    });

    var data$1 = { mediaKeys:{ title:"Managing media keys",
        description:"Here you can change behaviour of media keys." },
      previousSeeking:{ title:"‘Previous track’ key will rewind to beginning",
        description:"‘Previous’ media key will be rewinding to beginning if track played for more than two seconds." },
      latestNext:{ title:"Do not disable ‘Next track’ at the end of playlist",
        description:"‘Next track’ key will be used as ‘Stop’ at the end of playlists." },
      nowPlayingHeader:"Now Playing notifications",
      notifications:{ title:"Turn on notifications",
        description:"When playing music in background, show notifications for currently playing track." },
      notificationsDismiss:{ title:"Notifications closing",
        description:"Some browsers automatically close notifications, but some not." },
      notificationsDismissTime:{ "3s":"3 seconds after",
        "5s":"5 seconds after",
        auto:"Automatically" },
      toggleState:{ on:"On",
        off:"Off" },
      advert:{ notification:"Subscribe to listen without ads." },
      crackdown:{ notification:"Music is paused" },
      installed:"Yandex.Music MSA extension has been installed",
      updated:"Yandex.Music MSA extension has been updated" };
    var mediaKeys$1 = data$1.mediaKeys;
    var previousSeeking$1 = data$1.previousSeeking;
    var latestNext$1 = data$1.latestNext;
    var nowPlayingHeader$1 = data$1.nowPlayingHeader;
    var notifications$1 = data$1.notifications;
    var notificationsDismiss$1 = data$1.notificationsDismiss;
    var notificationsDismissTime$1 = data$1.notificationsDismissTime;
    var toggleState$1 = data$1.toggleState;
    var advert$1 = data$1.advert;
    var crackdown$1 = data$1.crackdown;
    var installed$1 = data$1.installed;
    var updated$1 = data$1.updated;

    var enGB = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': data$1,
        mediaKeys: mediaKeys$1,
        previousSeeking: previousSeeking$1,
        latestNext: latestNext$1,
        nowPlayingHeader: nowPlayingHeader$1,
        notifications: notifications$1,
        notificationsDismiss: notificationsDismiss$1,
        notificationsDismissTime: notificationsDismissTime$1,
        toggleState: toggleState$1,
        advert: advert$1,
        crackdown: crackdown$1,
        installed: installed$1,
        updated: updated$1
    });

    const Locales = {
        "en-GB": enGB,
        "ru-RU": ruRU,
    };

    let detectedLocale = "en-GB"; // По-умолчанию Английская локаль
    /**
     * Преобразует локаль формата приложения Яндекс.Музыки в наш
     *
     * @param yLocale Локаль формата приложения Яндекс.Музыки
     * @returns Наша максимальная подходящая локаль
     */
    function convertYLocale(yLocale) {
        switch (yLocale) {
            case "ru":
            case "kk":
                return "ru-RU";
            default:
                return "en-GB";
        }
    }
    /**
     * Запрашивает строку прямо из локали приложения Яндекс.Музыки
     *
     * @param keyset К какому набору ключей принадлежит эта строка
     * @param key Строка для которой необходимо получить перевод
     * @returns Возвращает либо саму строку, либо перевод для неё
     */
    function getAppString(keyset, key) {
        return unsafeWindow.i18nTranslate(keyset, key);
    }
    /**
     * Пытается опознать используемую пользователем локаль
     *
     * @throws {Error} Если не удаётся прочитать настройку приложения Яндекс.Музыки
     */
    function tryDetectLocale() {
        var _a;
        const yLocale = (_a = getInternalAPI().settings) === null || _a === void 0 ? void 0 : _a.lang;
        if (yLocale == null)
            throw new Error("Failed to detect locale.");
        detectedLocale = convertYLocale(yLocale);
    }
    /**
     * Получает карту строк для текущей используемой локали
     *
     * @returns Карта всех строк для текущей локали
     */
    function getStringsMap() {
        if (detectedLocale == null) {
            throw new Error("Current locale is not detected.");
        }
        const locale = Locales[detectedLocale];
        if (locale == null) {
            throw new Error(`Locale "${detectedLocale}" is not defined.`);
        }
        return locale;
    }

    /**
     * Перечисление всех возможных вариантов для настройки "времени удаления уведомлений"
     */
    var NotificationDismissTime;
    (function (NotificationDismissTime) {
        /**
         * Уведомления должны удаляться спустя 3 секунды
         */
        NotificationDismissTime["3s"] = "3s";
        /**
         * Уведомления должны удаляться спустя 5 секунд
         */
        NotificationDismissTime["5s"] = "5s";
        /**
         * Уведомления должны удаляться системой или самим браузером
         */
        NotificationDismissTime["Auto"] = "auto";
    })(NotificationDismissTime || (NotificationDismissTime = {}));

    // В некоторых скриптовых менеджерах функции сохранения и получения
    // настроек асинхронны, в других наоборот. Для непромисов await тоже
    // можно по-прежнему вызывать, хоть это и плохая практика
    /**
     * Возвращает функцию сохранения настроек текущего скриптового менеджера
     *
     * @returns Функция сохранения настроек в текущем скриптовом менеджере
     */
    function getGetValue() {
        var _a, _b;
        // eslint-disable-next-line
        return _b = (_a = GM) === null || _a === void 0 ? void 0 : _a.getValue, (_b !== null && _b !== void 0 ? _b : window.GM_getValue);
    }
    /**
     * Получает и возвращает сохранённую настройку в текущем скриптовом менеджере,
     * если настройка не сохранялась до этого, возвращает значение по умолчанию
     *
     * @param name Название настройки, которую необходимо запросить
     * @param defaultValue Значение настройки по умолчанию
     * @returns Прошлое сохранённое значение или значение по умолчанию
     */
    function getValueOrDefault(name, defaultValue) {
        return __awaiter(this, void 0, void 0, function* () {
            const value = yield getGetValue()(name);
            if (value == null)
                return defaultValue;
            // eslint-disable-next-line
            return value;
        });
    }
    /**
     * Сохраняет значение настройки в текущем скриптовом менеджере
     *
     * Непримитивные значения сохраняются в каждом менеджере по-разному,
     * поэтому рекомендуется упрощать данные, для объектов использовать JSON
     *
     * @param name Название изменяемой настройки
     * @param value Значение указанной настройки
     */
    function setValue(name, value) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line
            const setGMValue = (_b = (_a = GM) === null || _a === void 0 ? void 0 : _a.setValue, (_b !== null && _b !== void 0 ? _b : window.GM_setValue));
            yield setGMValue(name, value);
        });
    }

    /**
     * Возвращает интерфейс медиа-сессии, если доступно
     *
     * @returns Интерфейс медиа-сессии
     */
    function getMediaSession() {
        return navigator.mediaSession;
    }

    var throttleit = throttle;

    /**
     * Returns a new function that, when invoked, invokes `func` at most once per `wait` milliseconds.
     *
     * @param {Function} func Function to wrap.
     * @param {Number} wait Number of milliseconds that must elapse between `func` invocations.
     * @return {Function} A new function that wraps the `func` function passed in.
     */

    function throttle (func, wait) {
      var ctx, args, rtn, timeoutID; // caching
      var last = 0;

      return function throttled () {
        ctx = this;
        args = arguments;
        var delta = new Date() - last;
        if (!timeoutID)
          if (delta >= wait) call();
          else timeoutID = setTimeout(call, wait - delta);
        return rtn;
      };

      function call () {
        timeoutID = 0;
        last = +new Date();
        rtn = func.apply(ctx, args);
        ctx = null;
        args = null;
      }
    }

    const $BOUND_LISTENERS = Symbol("boundListeners");
    /**
     * Представляет собой класс, который базируется на внешнем API
     */
    class ExternalAPIBased {
        constructor() {
            const externalAPI = getExternalAPI();
            if (externalAPI == null) {
                throw new Error("External API is not available");
            }
            this._externalAPI = externalAPI;
            this._externalAPI = externalAPI;
            this[$BOUND_LISTENERS] = Object.create(null);
        }
        /**
         * Привязывает обработчик к событию внешнего API
         *
         * Из-за сложности с типизацией, данный метод не работает для события рекламы
         *
         * @param event Собитие к которому выполняется привязка
         * @param callback Колбэк функция, вызываемая для события
         *
         * @throws {Error} Если к событию уже привязан другой обработчик
         */
        _bindListener(event, callback) {
            const listeners = this[$BOUND_LISTENERS];
            if (listeners[event] != null) {
                throw new Error(`Event "${event}" is bound already.`);
            }
            this._externalAPI.on(event, callback);
            listeners[event] = callback;
        }
        /**
         * Убирает обработчик с события внешнего API
         *
         * @param event Событие, к которому привязан обработчик
         *
         * @throws {Error} Если к событию не был привязан ни один обработчик
         */
        _unbindListener(event) {
            const listeners = this[$BOUND_LISTENERS];
            const listener = listeners[event];
            if (listener == null) {
                throw new Error(`Event "${event}" is not bound.`);
            }
            this._externalAPI.off(event, listener);
            listeners[event] = undefined;
        }
    }

    /**
     * Размеры каверов, которые будут использоваться в качестве артворков MSA
     */
    const ARTWORKS_SIZES = [
        "80x80" /* "80x80" */,
        "200x200" /* "200x200" */,
        "400x400" /* "400x400" */,
    ];
    /**
     * Интвервал для троттлинга обновлений прогресса в MSA
     */
    const PROGRESS_UPDATE_TIME = 1000; // мс
    /**
     * Обновляет метаданные и прогресс в MSA
     */
    class MetadataUpdater extends ExternalAPIBased {
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
        bindEvents() {
            this._bindListener("track" /* CurrentTrack */, () => this._onCurrentTrack());
            if (this._mediaSession.setPositionState != null) {
                // Яндекс.Музыка сообщает о прогрессе каждые ~500 мс,
                // не имеет смысла так часто рапортавать об этом MSA,
                // поэтому троттлим вызовы на интервал заданный константой
                const onProgress = throttleit(() => this._onProgress(), PROGRESS_UPDATE_TIME);
                this._bindListener("progress" /* Progress */, onProgress);
            }
            this._bindListener("state" /* StateChanged */, () => this._onStateChange());
            this._externalAPI.on("advert" /* Advert */, (advert) => this._onAdvert(advert));
        }
        /**
         * Принудительно вызывает методы обновления метаданных
         */
        forceUpdate() {
            this._onCurrentTrack();
            this._onStateChange();
            this._onProgress();
        }
        /**
         * Преобразует треки формата внешнего API в формат `MediaMetadata`
         *
         * @param track Трек для преобразования
         * @returns Объект метаданных для MSA
         */
        _convertToMetadata(track) {
            var _a, _b, _c;
            const artworks = [];
            if (track.cover != null) {
                for (const size of ARTWORKS_SIZES) {
                    const url = getCoverURL(track, size);
                    if (url == null)
                        continue;
                    artworks.push({
                        src: url,
                        sizes: size,
                    });
                }
            }
            return new MediaMetadata({
                artist: (_b = (_a = track.artists) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.title,
                title: track.title,
                album: (_c = track.album) === null || _c === void 0 ? void 0 : _c.title,
                artwork: artworks,
            });
        }
        /**
         * Метод вызываемый после события изменения трека
         */
        _onCurrentTrack() {
            const currentTrack = this._externalAPI.getCurrentTrack();
            if (currentTrack == null) {
                this._mediaSession.metadata = undefined;
                return;
            }
            this._mediaSession.metadata = this._convertToMetadata(currentTrack);
        }
        /**
         * Метод вызываемый после события изменения скорости проигрывания
         */
        _onProgress() {
            var _a, _b;
            const externalAPI = this._externalAPI;
            const progress = externalAPI.getProgress();
            let playbackRate = this._currentPlaybackRate;
            if (playbackRate == null) {
                playbackRate = externalAPI.getSpeed();
                this._currentPlaybackRate = playbackRate;
            }
            // eslint-disable-next-line @typescript-eslint/unbound-method
            (_b = (_a = this._mediaSession).setPositionState) === null || _b === void 0 ? void 0 : _b.call(_a, {
                duration: progress.duration,
                position: progress.position,
                playbackRate: this._currentPlaybackRate,
            });
        }
        /**
         * Метод вызываемый после события изменения состояния проигрывания
         */
        _onStateChange() {
            const currentTrack = this._externalAPI.getCurrentTrack();
            if (currentTrack == null) {
                this._mediaSession.playbackState = "none" /* None */;
                return;
            }
            const isPlaying = this._externalAPI.isPlaying();
            this._mediaSession.playbackState = isPlaying
                ? "playing" /* Playing */
                : "paused" /* Paused */;
        }
        /**
         * Метод вызываемый после события рекламы
         *
         * @param advert Текущее рекламное объявление
         */
        _onAdvert(advert) {
            if (advert === false)
                return;
            let artwork;
            if (advert.image != null) {
                artwork = [{
                        src: advert.image,
                        sizes: "900x900",
                    }];
            }
            this._mediaSession.metadata = new MediaMetadata({
                title: advert.title,
                album: getAppString("audio-advert", "Реклама"),
                artwork,
            });
        }
    }

    const LOGGER = new Logger("ControlsUpdater");
    /**
     * Граница в секундах до которой перемотка клавишей назад не работает
     */
    const PREVIOUS_SEEKING_EDGE = 2;
    class ControlsUpdater extends ExternalAPIBased {
        constructor() {
            super();
            /**
             * Должна ли кнопка "Вперёд" быть включена в конце плейлистов
             */
            this.latestNext = true;
            /**
             * Должна ли кнопка "Назад" перематывать в начало
             */
            this.previousSeeking = true;
            /**
             * Карта состояний привязки к действиям
             */
            this._boundActions = Object.create(null);
            const mediaSession = getMediaSession();
            if (mediaSession == null) {
                throw new Error("MediaSession API is not supported in this browser.");
            }
            else if (mediaSession.setActionHandler == null) {
                throw new Error("MediaSession#setActionHandler is not supported in this browser.");
            }
            this._mediaSession = mediaSession;
        }
        /**
         * Привязывает необходимые обработчики
         */
        bindEvents() {
            this._bindListener("controls" /* ControlsChanged */, () => this._onControlsChange());
            this._externalAPI.on("advert" /* Advert */, (advert) => this._onAdvert(advert));
        }
        /**
         * Принудительно обновляет состояние всех кнопок
         */
        forceUpdate() {
            this._onControlsChange();
        }
        /**
         * Переключается к прошлому треку или перематывает в начало в зависимости от настроек
         */
        _previous() {
            const externalAPI = this._externalAPI;
            const { position } = externalAPI.getProgress();
            if (this.previousSeeking && position > PREVIOUS_SEEKING_EDGE) {
                externalAPI.setPosition(0);
                return;
            }
            // При поведении с перемоткой, кнопка принудительно включается поэтому
            // будет совершенно не лишним проверить если прошлый трек имеется
            if (externalAPI.getPrevTrack() != null)
                this._externalAPI.prev();
        }
        /**
         * Переключается на следующий трек или останавливает проигрывание
         */
        _nextOrStop() {
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
        _checkHandler(isAvailable, relatedAction, getHandler) {
            const bounds = this._boundActions;
            const isBound = bounds[relatedAction];
            if (isBound === isAvailable)
                return;
            try {
                this._mediaSession.setActionHandler(relatedAction, isAvailable ? getHandler() : null);
            }
            catch (err) {
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
        _onControlsChange() {
            var _a, _b;
            const externalAPI = this._externalAPI;
            const contols = externalAPI.getControls();
            this._checkHandler(
            // eslint-disable-next-line
            (_a = contols.next, (_a !== null && _a !== void 0 ? _a : false)) || this.latestNext, "nexttrack" /* NextTrack */, () => () => this._nextOrStop());
            this._checkHandler(
            // eslint-disable-next-line
            (_b = contols.prev, (_b !== null && _b !== void 0 ? _b : false)) || this.previousSeeking, "previoustrack" /* PreviousTrack */, () => () => this._previous());
            this._checkHandler(true, "pause" /* Pause */, () => () => externalAPI.togglePause(true));
            this._checkHandler(true, "play" /* Play */, () => () => externalAPI.togglePause(false));
        }
        /**
         * Упрощённый метод, чтобы убирать обрабочики для действий,
         * которые перестали быть доступны.
         *
         * @param action Действие, которое перестало быть доступным
         */
        _markUnavailable(action) {
            try {
                this._mediaSession.setActionHandler(action, null);
            }
            catch (_a) {
                // LOGGER.log("warn", `Action "${action}" is not supported in this browser.`);
            }
            this._boundActions[action] = false;
        }
        /**
         * Метод, вызываемый после события появления рекламы
         *
         * @param advert Объект объявления
         */
        _onAdvert(advert) {
            // ESLint отлично сыграл в этом случае, так как advert
            // никогда не бывает `true`, не имеет никакого смысла
            // делать что-то ещё, кроме как проверять его тип
            if (typeof advert === "boolean") {
                this._onControlsChange();
                return;
            }
            this._markUnavailable("nexttrack" /* NextTrack */);
            this._markUnavailable("previoustrack" /* PreviousTrack */);
            // TODO: проверить доступность кнопок проигрывания/паузы при рекламе
            // this._markUnavailable(MediaSessionAction.Play);
            // this._markUnavailable(MediaSessionAction.Pause);
        }
    }

    /**
     * Представляет из себя интерактивный контрол
     */
    class Control {
        /**
         * Встроенная функция встраивания контрола
         *
         * @param element Встраиваемый элемент этого контрола
         * @param parent Родительский элемент, куда встраивается контрол
         * @param prepend Нужно ли встраивать контрол в самое начало
         */
        _mount(element, parent, prepend = false) {
            if (prepend != null && prepend)
                parent.prepend(element);
            else
                parent.appendChild(element);
        }
        /**
         * Проверяет если элемент прендалежит к данному контролу или нет
         *
         * @param element Элемент чтобы проверить
         * @param control Контрол для проверки
         * @returns Булев обозначающий пренадлежит ли элемент к контролу или нет
         */
        static isFrom(element, control) {
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
        static searchIn(element, controls) {
            const predicate = (control) => Control.isFrom(element, control);
            return Array.prototype.find.call(controls, predicate);
        }
    }

    /**
     * Встраивает элемент в родительский элемент перед другим его дочерним объектом
     *
     * @param refChild Дочерний элемент, перед которым встраивается элемент
     * @param newNode Элемент, который должен быть встроен
     * @throws {Error} Если у дочернего элемента `refChild` отсутствует родительский элемент
     */
    /**
     * Привязывает обработчики событий к элементу из хэш-карты
     *
     * @param element Элемент, к которому привязываются данные обработчики
     * @param eventListeners Хэш-карта обработчиков для привязки
     * @returns Сам элемент, но отныне реагирующий на события
     */
    function addEventListeners(element, eventListeners) {
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
    function assignStyles(element, styles) {
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
    function assignAttributes(element, attributes) {
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
    function assingDataValues(element, values) {
        Object.assign(element.dataset, values);
        return element;
    }
    /**
     * Встраивает каждый узел из массива в данный родительский элемент
     *
     * @param nodes Узлы, которые необходимо встроить в данный родительский элемент
     * @param parent Родительский элемент, в который будут встроены узлы
     */
    function appendEvery(nodes, parent) {
        for (const element of nodes)
            parent.appendChild(element);
    }
    /**
     * Создаёт новый элемент и меняет его свойства, а также встраивает
     * по желанию его в другой элемент или другие элементы в него
     *
     * @param tagName Тег создаваемого элемента
     * @param options Опции для создаваемого элемента
     * @returns Новосозданный элемент
     */
    function createElement(tagName, options) {
        const el = document.createElement(tagName);
        if (options != null) {
            const { props, style, events, attributes, dataSet, mount, child, children, } = options;
            if (props != null)
                Object.assign(el, props);
            if (attributes != null)
                assignAttributes(el, attributes);
            if (dataSet != null)
                assingDataValues(el, dataSet);
            if (style != null)
                assignStyles(el, style);
            if (events != null)
                addEventListeners(el, events);
            if (mount instanceof HTMLElement)
                mount.appendChild(el);
            if (child != null)
                el.appendChild(child);
            if (children != null)
                appendEvery(children, el);
        }
        return el;
    }

    /**
     * Представляет собой переключатель в настройках
     */
    class Toggle extends Control {
        /**
         * Создаёт новый переключатель
         *
         * @param id ID для чекбокса внутри переключателя
         * @param initialState Изначальное состояние переключателя
         */
        constructor(id, initialState) {
            super();
            const checkbox = createElement("input", {
                props: {
                    className: "d-toggler__input",
                    type: "checkbox",
                    id,
                },
            });
            this._checkbox = checkbox;
            const button = createElement("div", {
                props: {
                    className: "d-toggler__btn deco-toggler-btn",
                },
            });
            this._button = button;
            let isPending = false;
            const view = createElement("div", {
                props: {
                    className: "d-toggler__view deco-toggler-view",
                },
                children: [
                    createElement("div", {
                        props: {
                            className: "d-toggler__bg deco-toggler-bg",
                        },
                    }),
                    button,
                    createElement("div", {
                        props: {
                            className: "d-toggler__border deco-toggler-border",
                        },
                    }),
                ],
                events: {
                    click: () => __awaiter(this, void 0, void 0, function* () {
                        if (isPending)
                            return;
                        const pendingState = !checkbox.checked;
                        if (this._checkFunction != null) {
                            this._togglePending(isPending = true);
                            const result = yield this._checkFunction(pendingState);
                            this._togglePending(isPending = false);
                            if (!result)
                                return;
                        }
                        checkbox.checked = pendingState;
                        this.updateState({
                            isToggled: checkbox.checked,
                        });
                    }),
                },
            });
            const text = createElement("span", {
                props: {
                    className: "d-toggler__text d-toggler__text_selected deco-toggler-text",
                },
            });
            // Элемент противоположного текста необходим, чтобы переключатель не прыгал
            const oppositeText = createElement("span", {
                props: {
                    className: "d-toggler__text d-toggler__text_opposite deco-toggler-text",
                },
            });
            this._selectedText = text;
            this._oppositeText = oppositeText;
            const value = createElement("div", {
                props: {
                    className: "d-toggler__value",
                },
                children: [text, oppositeText],
            });
            this._wrap = createElement("div", {
                props: {
                    className: "d-toggler deco-toggler d-toggler_size-M",
                },
                children: [
                    createElement("div", {
                        props: {
                            className: "d-toggler__content",
                        },
                        children: [
                            checkbox,
                            view,
                            value,
                        ],
                    }),
                ],
            });
            const [event, trigger] = Event.create();
            this.toggled = event;
            this._toggledTrigger = trigger;
            if (initialState != null)
                this.updateState(initialState);
        }
        mountTo(parent, prepend) {
            this._mount(this._wrap, parent, prepend);
        }
        updateState(state) {
            let anythingChanged = false;
            if (state.checkFunction != null) {
                this._checkFunction = state.checkFunction;
                anythingChanged = true;
            }
            if (state.isToggled != null) {
                this._checkbox.checked = state.isToggled;
                this._wrap.classList.toggle("deco-toggler_on", state.isToggled);
                const localized = getStringsMap().toggleState;
                this._selectedText.innerText = localized[state.isToggled ? "on" : "off"];
                this._oppositeText.innerText = localized[!state.isToggled ? "on" : "off"];
                this._toggledTrigger(this, state.isToggled);
                anythingChanged = true;
            }
            return anythingChanged;
        }
        /**
         * Вводит переключатель в состояния переключения и блокирует отзывчивость на клики
         *
         * @param isPending Ввести/вывести ли переключатель из этого состояния
         */
        _togglePending(isPending) {
            this._button.style.left = isPending ? "18px" : "";
            this._wrap.style.pointerEvents = isPending ? "none" : "";
            this._wrap.style.opacity = isPending ? ".8" : "";
        }
        _getControlElement() {
            return this._wrap;
        }
    }

    /**
     * Представляет собой строку настройки с заголовком и описанием
     */
    class SettingsLine extends Control {
        /**
         * Создаёт новую строку настройки
         *
         * @param state Изначальное состояние строки
         */
        constructor(state) {
            super();
            const labelNode = document.createTextNode("&nbsp;");
            this._labelTextNode = labelNode;
            const label = createElement("div", {
                props: {
                    className: "page-settings__line-label typo",
                },
                children: [labelNode],
            });
            this._label = label;
            this._wrap = createElement("div", {
                props: {
                    className: "page-settings__line deco-border",
                },
                child: label,
            });
            if (state != null)
                this.updateState(state);
        }
        /**
         * Возвращает или создаёт элемент текста под заголовоком
         *
         * @returns Элемент текста под заголовком
         */
        _getLabelHint() {
            let labelHint = this._labelHint;
            if (labelHint == null) {
                labelHint = createElement("div", {
                    props: {
                        className: "typo-secondary",
                    },
                    mount: this._label,
                });
                this._labelHint = labelHint;
            }
            return labelHint;
        }
        /**
         * Возвращает или создаёт элемент для встраивания контрола
         *
         * @returns Элемент для встраивания контрола
         */
        _getControlMount() {
            let controlMount = this._controlBlock;
            if (controlMount == null) {
                controlMount = createElement("div", {
                    props: {
                        className: "page-settings__line-control",
                    },
                });
                this._controlBlock = controlMount;
            }
            return controlMount;
        }
        mountTo(parent, prepend) {
            this._mount(this._wrap, parent, prepend);
        }
        updateState(state) {
            var _a, _b;
            let anythingChanged = false;
            if (state.labelText !== undefined) {
                // eslint-disable-next-line
                this._labelTextNode.textContent = (_a = state.labelText, (_a !== null && _a !== void 0 ? _a : ""));
                anythingChanged = true;
            }
            if (state.labelHint !== undefined) {
                const labelHint = this._getLabelHint();
                // eslint-disable-next-line
                labelHint.innerText = (_b = state.labelHint, (_b !== null && _b !== void 0 ? _b : ""));
                const isMounted = labelHint.parentElement === this._label;
                if (state.labelHint == null) {
                    if (isMounted)
                        labelHint.remove();
                }
                else if (!isMounted) {
                    this._label.appendChild(labelHint);
                }
                anythingChanged = true;
            }
            if (state.control !== undefined) {
                const controlMount = this._getControlMount();
                const isMounted = controlMount.parentElement === this._wrap;
                controlMount.innerHTML = "";
                if (state.control != null) {
                    state.control.mountTo(controlMount);
                    if (!isMounted)
                        this._wrap.appendChild(controlMount);
                }
                else if (isMounted) {
                    controlMount.remove();
                }
                anythingChanged = true;
            }
            return anythingChanged;
        }
        _getControlElement() {
            return this._wrap;
        }
    }

    /**
     * Представляет собой блок настроек
     */
    class SettingsBlock extends Control {
        /**
         * Создаёт новый блок настроек
         *
         * @param initialState Изначальное состояние блока
         */
        constructor(initialState) {
            super();
            this._block = createElement("div", {
                props: {
                    className: "page-settings__block",
                },
            });
            if (initialState != null)
                this.updateState(initialState);
        }
        mountTo(parent, prepend) {
            this._mount(this._block, parent, prepend);
        }
        /**
         * Возвращает или создаёт новый элемент заголовка блока
         *
         * @returns Элемент заголовка блока
         */
        _getTitle() {
            let title = this._title;
            if (title == null) {
                title = createElement("h2", {
                    props: {
                        className: "page-settings__subtitle typo-h2_bold",
                    },
                });
                this._title = title;
            }
            return title;
        }
        /**
         * Встраивает новую строку в блок
         *
         * @param control Новая строка для встраивания
         * @returns Блок сам по себе для цепочных вызовов
         */
        appendControl(control) {
            control.mountTo(this._block, false);
            return this;
        }
        /**
         * Обновляет заголовок блока как указано в объекте состояния
         *
         * @param state Объект обновления состояния
         * @returns Булевое значение, обозначающее изменилось ли что-нибудь
         */
        _updateTitle(state) {
            if (state.title == null && this._title == null)
                return false;
            const title = this._getTitle();
            const isMounted = title.parentElement === this._block;
            if (state.title == null) {
                if (isMounted) {
                    title.remove();
                    return true;
                }
                return false;
            }
            if (!isMounted)
                this._block.prepend(title);
            title.textContent = state.title;
            return true;
        }
        /**
         * Обновляет контролы внутри блока на указанные в объекте состояния
         *
         * @param state Объект обновления состояния
         * @returns Булевое значение, обозначающее изменилось ли что-нибудь
         */
        _updateControls(state) {
            const { controls } = state;
            if (controls == null)
                return false;
            this._block.childNodes.forEach((node) => {
                node.remove();
            });
            const title = this._title;
            if (title != null)
                this._block.appendChild(title);
            for (const control of controls) {
                control.mountTo(this._block);
            }
            return true;
        }
        updateState(state) {
            let anythingChanged = false;
            if (this._updateTitle(state)) {
                anythingChanged = true;
            }
            if (this._updateControls(state)) {
                anythingChanged = true;
            }
            return anythingChanged;
        }
        _getControlElement() {
            return this._block;
        }
    }

    /**
     * Представляет собой контрол селектора
     */
    class Selector extends Control {
        /**
         * Создаёт новый контрол селектора
         *
         * @param data Данные, необходимые для создания селектора
         * @param initialState Изначальное состояние селектора
         */
        constructor(data, initialState) {
            var _a, _b;
            super();
            const selectedItem = data.items.find((item) => item.selected);
            const innerItem = createElement("span", {
                props: {
                    className: "d-select__inner-item",
                },
                child: createElement("span", {
                    props: {
                        className: "d-select__text",
                        // eslint-disable-next-line
                        innerText: (_b = (_a = selectedItem) === null || _a === void 0 ? void 0 : _a.title, (_b !== null && _b !== void 0 ? _b : "")),
                    },
                }),
            });
            const dropdownButton = createElement("div", {
                props: {
                    className: "d-select__button deco-button-simple deco-button",
                },
                child: createElement("span", {
                    props: {
                        className: "d-icon deco-icon d-icon_dropdown",
                    },
                }),
            });
            const inner = createElement("div", {
                props: {
                    className: "d-select__inner deco-button-stylable",
                },
                children: [innerItem, dropdownButton],
            });
            const wrap = createElement("div", {
                props: {
                    className: "d-select deco-button",
                },
                child: inner,
            });
            wrap.classList.add(data.className);
            this._wrap = wrap;
            const block = getInternalAPI().blocks.createBlock({
                type: "d-select",
                data: {
                    class: data.className,
                    groups: [data.items],
                },
            }, wrap);
            this._block = block;
            const [changedEvent, changedTrigger] = Event.create();
            this.valueChanged = changedEvent;
            block.on("change" /* ValueChanged */, (details) => {
                changedTrigger(this, details.value);
            });
            if (initialState != null)
                this.updateState(initialState);
        }
        mountTo(parent, prepend = false) {
            this._mount(this._wrap, parent, prepend);
        }
        updateState(state) {
            let anythingChanged = false;
            if (state.isDisabled != null) {
                this._block.toggleDisabled(state.isDisabled);
                anythingChanged = true;
            }
            if (state.selectedItem != null) {
                this._block.val(state.selectedItem);
                anythingChanged = true;
            }
            return anythingChanged;
        }
        /**
         * Уничтожает селектор, удаляя все данные, popup и делая его неинтерактивным
         *
         * Уничтоженный селектор необходимо повторно инициализировать с новыми
         * данными, что почти равносильно созданию нового селектора, поэтому
         * функционал инициализации селектора не реализуем и уничтоженные
         * селекторы больше **не следует использовать**.
         */
        destroy() {
            this._block.destroy();
        }
        _getControlElement() {
            return this._wrap;
        }
    }

    /**
     * Представляет собой надпись в настройках
     */
    class SettingsLineLabel extends Control {
        /**
         * Создаёт новую надпись для настроек
         *
         * @param initialState Изначальное состояние надписи
         */
        constructor(initialState) {
            super();
            const container = createElement("div", {
                props: {
                    className: "page-settings__line-label-container",
                },
            });
            this._container = container;
            const labelContainer = createElement("div", {
                props: {
                    className: "page-settings__line-label",
                },
                mount: container,
            });
            const label = createElement("div", {
                props: {
                    className: "typo",
                },
                mount: labelContainer,
            });
            this._label = label;
            if (initialState != null)
                this.updateState(initialState);
        }
        updateState(state) {
            let anythingChanged = false;
            if (state.content != null) {
                this._label.innerText = state.content;
                anythingChanged = true;
            }
            if (state.isSecondary != null) {
                this._label.classList.toggle("typo-secondary", state.isSecondary);
                this._label.classList.toggle("deco-typo-secondary", state.isSecondary);
                anythingChanged = true;
            }
            return anythingChanged;
        }
        mountTo(parent, prepend) {
            this._mount(this._container, parent, prepend);
        }
        _getControlElement() {
            return this._container;
        }
    }

    const LOGGER$1 = new Logger("SettingsController");
    /**
     * Waits when settings page is loaded and adds ours controls
     */
    class Settings {
        constructor() {
            this.settings = {
                ["notificationsEnabled" /* NowPlayingNotify */]: false,
                ["notificationsDismissTime" /* NowPlayingNotifyTime */]: NotificationDismissTime.Auto,
                ["lastNextEnabled" /* LatestNext */]: false,
                ["seekBeginningEnabled" /* PreviousSeeking */]: false,
            };
            {
                const [event, triggerFunc] = Event.create();
                this.settingUpdated = event;
                this._triggerSettingsUpdated = triggerFunc;
            }
        }
        /**
         * Обновляет настройку и вызывает событие обновления
         *
         * @param setting Настройка, которая должна быть обновлена
         * @param value Новое значение настройки
         */
        _updateSetting(setting, value) {
            this.settings[setting] = value;
            this._triggerSettingsUpdated(this, setting, value);
        }
        /**
         * Привязывает обработчик для события навигации для добавления наших контролов
         */
        bindEvents() {
            onNavigationTo("page-settings", ({ what }) => this._onSettingsPageLoaded(what));
        }
        /**
         * Принудительно вызывает проверку текущей страницы
         * и добавления наших контролов при необходимости
         */
        forceUpdateState() {
            const currentPage = getCurrentPageData();
            if (currentPage == null)
                return;
            const { what } = currentPage;
            this._onSettingsPageLoaded(what);
        }
        /**
         * Обновляет и возвращает данные для селектора времени закрытия уведомлений
         *
         * @returns Кортеж из массива элементов и "обратной" слабой карты с их значениями
         */
        _getDismissSelectorData() {
            let reverseMap = this._dismissSelectorItemsMaps;
            if (reverseMap == null) {
                reverseMap = new WeakMap();
                this._dismissSelectorItemsMaps = reverseMap;
            }
            let items = this._dismissSelectorItems;
            if (items == null) {
                items = [];
                const localizedValues = getStringsMap().notificationsDismissTime;
                const options = Object.values(NotificationDismissTime);
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
            const currentOption = this.settings["notificationsDismissTime" /* NowPlayingNotifyTime */];
            for (const item of items) {
                const itemOption = reverseMap.get(item);
                item.selected = itemOption === currentOption;
            }
            return [items, reverseMap];
        }
        /**
         * Создаёт новый селектор времени закрытия уведомлений
         *
         * @returns Новосозданный селектор
         */
        _getDismissSelector() {
            let dismissSelector = this._dismissSelector;
            if (dismissSelector != null) {
                LOGGER$1.log("warn", "Notification dismiss selector detected not destroyed");
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
                const option = reverseMap.get(value);
                this._updateSetting("notificationsDismissTime" /* NowPlayingNotifyTime */, option);
            });
            dismissSelector.updateState({
                isDisabled: !this.settings["notificationsEnabled" /* NowPlayingNotify */],
            });
            return dismissSelector;
        }
        /**
         * Обновляет и возвращает строку для селектора времени закрытия уведомлений
         *
         * @returns Подготовленная строка с селектором
         */
        _getDismissSelectorLine() {
            var _a;
            let dismissSelectorLine = this._dismissSelectorLine;
            const localized = getStringsMap().notificationsDismiss;
            if (dismissSelectorLine == null) {
                dismissSelectorLine = new SettingsLine({
                    labelText: localized.title,
                    labelHint: localized.description,
                });
                this._dismissSelectorLine = dismissSelectorLine;
            }
            (_a = this._dismissSelectorLine) === null || _a === void 0 ? void 0 : _a.updateState({
                control: this._getDismissSelector(),
            });
            return dismissSelectorLine;
        }
        /**
         * Обновляет и возвращает переключатель для уведомлений о текущем треке
         *
         * @returns Подготовленный переключатель
         */
        _getNotificationsToggle() {
            let notificationsToggle = this._notificationsToggle;
            if (notificationsToggle == null) {
                notificationsToggle = new Toggle("yamumsa--notifications_enabled", {
                    checkFunction: (pendingValue) => __awaiter(this, void 0, void 0, function* () {
                        if (!pendingValue)
                            return true;
                        const permission = yield Notification.requestPermission();
                        return permission === "granted";
                    }),
                });
                notificationsToggle.toggled.on((isToggled) => {
                    // TODO: имеет смысл блокировать селектор времени, если уведомления отключены
                    var _a;
                    this._updateSetting("notificationsEnabled" /* NowPlayingNotify */, isToggled);
                    (_a = this._dismissSelector) === null || _a === void 0 ? void 0 : _a.updateState({
                        isDisabled: !isToggled,
                    });
                });
                this._notificationsToggle = notificationsToggle;
            }
            notificationsToggle.updateState({
                isToggled: this.settings["notificationsEnabled" /* NowPlayingNotify */],
            });
            return notificationsToggle;
        }
        /**
         * Обновляет и возвращает блок настроек уведомлений о текущем треке
         *
         * @returns Подготовленный блок настроек
         */
        _getNotificationsBlock() {
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
            notificationsBlock.appendControl(this._getDismissSelectorLine());
            return notificationsBlock;
        }
        /**
         * Обновляет и возвращает переключатель опции перемотки клавишей "назад"
         *
         * @returns Подготовленный переключатель
         */
        _getPreviousSeekingToggle() {
            let previousSeekingToggle = this._previousSeekingToggle;
            if (previousSeekingToggle == null) {
                previousSeekingToggle = new Toggle("yamumsa__previous_seeking");
                previousSeekingToggle.toggled.on((isToggled) => this._updateSetting("seekBeginningEnabled" /* PreviousSeeking */, isToggled));
                this._previousSeekingToggle = previousSeekingToggle;
            }
            previousSeekingToggle.updateState({
                isToggled: this.settings["seekBeginningEnabled" /* PreviousSeeking */],
            });
            return previousSeekingToggle;
        }
        /**
         * Обновляет и возвращает строку для переключателя опции перемотки клавишей "Назад"
         *
         * @returns Подготовленная строка
         */
        _getPreviousSeekingLine() {
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
        /**
         * Обновляет переключатель для опции клавиши "Вперёд" в конце плейлиста
         *
         * @returns Подготовленный переключатель
         */
        _getLatestNextToggle() {
            let toggle = this._latestNextToggle;
            if (toggle == null) {
                toggle = new Toggle("yamumsa__latest_next");
                toggle.toggled.on((isToggled) => this._updateSetting("lastNextEnabled" /* LatestNext */, isToggled));
                this._latestNextToggle = toggle;
            }
            toggle.updateState({
                isToggled: this.settings["lastNextEnabled" /* LatestNext */],
            });
            return toggle;
        }
        /**
         * Обновляет и возвращает строку переключателя опции клавиши "Вперёд" в конце плейлиста
         *
         * @returns Подготовленная строка
         */
        _getLatestNextLine() {
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
        /**
         * Обновляет и возвращает строку с описанием блока настроек клавиш
         *
         * @returns Подготовленный блок
         */
        _getMediaKeysInfoLine() {
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
         * Обновляет и возвращает блок с настройками медиа-клавиш
         *
         * @returns Подготовленный блок
         */
        _getMediaKeysBlock() {
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
        /**
         * Проверяет, если страница настроек изменилась и нам необходимо встроить свои контролы
         *
         * @param newPage На какую страницу перешёл пользователь сейчас
         * @returns Булевое значение необходимости встраивать свои компоненты
         */
        _settingsPageChanged(newPage) {
            if (this._currentPage === newPage)
                return false;
            this._currentPage = newPage;
            return true;
        }
        /**
         * Метод, вызываемый после навигации пользователем на любую страницу настроек
         *
         * @param currentPage Какая страница настроек была загружена
         */
        _onSettingsPageLoaded(currentPage) {
            if (!this._settingsPageChanged(currentPage))
                return;
            switch (currentPage) {
                case "notifications":
                    {
                        const target = document.querySelector(".page-settings--notifications");
                        if (target == null)
                            break;
                        navigatedEvent.once(() => {
                            var _a;
                            (_a = this._dismissSelector) === null || _a === void 0 ? void 0 : _a.destroy();
                            this._dismissSelector = undefined;
                        });
                        this._getNotificationsBlock().mountTo(target, true);
                    }
                    break;
                case "other":
                    {
                        const target = document.querySelector(".page-settings--other");
                        if (target == null)
                            break;
                        this._getMediaKeysBlock().mountTo(target);
                    }
                    break;
            }
        }
    }

    const LOGGER$2 = new Logger("Notifications");
    /**
     * Сконвертированные интервалы закрытия обновлений
     */
    const DISMISS_TIMES = {
        [NotificationDismissTime.Auto]: -1,
        [NotificationDismissTime["3s"]]: 3000,
        [NotificationDismissTime["5s"]]: 5000,
    };
    /**
     * Контроллер отвечающий за отправку уведомлений о текущем играющем треке
     */
    class NowPlayingNotifications extends ExternalAPIBased {
        constructor() {
            super(...arguments);
            /**
             * Текущия опция времени закрытия уведомлений
             */
            this.dismissTime = NotificationDismissTime.Auto;
            /**
             * Включены ли уведомления
             */
            this._notificationsEnabled = false;
        }
        /**
         * Проверяет возможность отправки уведомлений и переключает их статус
         *
         * @param value Должны ли быть уведомления включены
         * @returns Булевое значение успешности переключения: переключение может
         * быть "безуспешно" если пользователь не дал разрешений отправку уведомлений
         */
        toggleNotifications(value) {
            if (this._notificationsEnabled === value)
                return true;
            if (!value) {
                this._notificationsEnabled = false;
                this._unbindEvents();
                LOGGER$2.log("log", "Notifications were disabled");
                return true;
            }
            if (Notification.permission !== "granted")
                return false;
            this._notificationsEnabled = true;
            this._bindEvents();
            LOGGER$2.log("log", "Notifications were enabled");
            return true;
        }
        /**
         * Привязывает необходимые обработчики
         *
         * @returns Булевое значение, сообщающее было ли привязано какое-либо событие
         */
        _bindEvents() {
            let anyBound = false;
            if (this._boundEventCallback == null) {
                const eventCallback = () => this._onTrackChange();
                this._externalAPI.on("track" /* CurrentTrack */, eventCallback);
                this._boundEventCallback = eventCallback;
                anyBound = true;
            }
            if (this._boundAdEventCallback == null) {
                const eventCallback = (advert) => this._onAdvert(advert);
                this._externalAPI.on("advert" /* Advert */, eventCallback);
                this._boundAdEventCallback = eventCallback;
                anyBound = true;
            }
            if (this._boundCrackdownEventCallback == null) {
                const eventCallback = () => this._onCrackdown();
                this._externalAPI.on("crackdownPause" /* CrackdownPause */, eventCallback);
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
        _unbindEvents() {
            let anyUnbound = false;
            const defaultCallback = this._boundEventCallback;
            const adCallback = this._boundAdEventCallback;
            const crackdownCallback = this._boundCrackdownEventCallback;
            if (defaultCallback != null) {
                this._externalAPI.off("track" /* CurrentTrack */, defaultCallback);
                this._boundEventCallback = undefined;
                anyUnbound = true;
            }
            if (adCallback != null) {
                this._externalAPI.off("advert" /* Advert */, adCallback);
                this._boundAdEventCallback = undefined;
                anyUnbound = true;
            }
            if (crackdownCallback != null) {
                this._externalAPI.off("crackdownPause" /* CrackdownPause */, crackdownCallback);
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
        _createNotification(title, options, dismiss = true) {
            const notification = new Notification(title, Object.assign({ tag: "yamumsa--nowplaying", silent: true }, options));
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
        _onTrackChange() {
            var _a, _b;
            const currentTrack = this._externalAPI.getCurrentTrack();
            // Мы могли бы использовать новомодное API видимости вкладки, но
            // к сожалению, оно не берёт во внимание переключение пользователя
            // на любое другое приложение. document.hasFocus отрабатывает отлично
            if (currentTrack == null || document.hasFocus())
                return;
            let body = "";
            if (currentTrack.artists != null) {
                body += `${(_a = currentTrack.artists[0]) === null || _a === void 0 ? void 0 : _a.title}\n`;
            }
            const source = this._externalAPI.getSourceInfo().title;
            const service = getAppString("meta", "Яндекс.Музыка");
            body += `${source} · ${service}`;
            this._createNotification(currentTrack.title, {
                // eslint-disable-next-line
                icon: (_b = getCoverURL(currentTrack, "200x200" /* "200x200" */), (_b !== null && _b !== void 0 ? _b : undefined)),
                body,
            });
        }
        /**
         * Метод вызываемый после события начала/окончания рекламы
         *
         * @param advert Объявление играющее в данный момент
         */
        _onAdvert(advert) {
            // Всегда принудительно закрываем прошлое уведомление с рекламой,
            // иногда пользователь может перейти ко вкладке и мы не станем
            if (this._previousAdNotification != null) {
                this._previousAdNotification.close();
                this._previousAdNotification = undefined;
            }
            if (typeof advert === "boolean" || document.hasFocus())
                return;
            const ad = getAppString("audio-advert", "Реклама");
            const service = getAppString("meta", "Яндекс.Музыка");
            let body = `${ad} · ${service}\n`;
            body += getStringsMap().advert.notification;
            const options = {
                image: advert.image,
                body,
            };
            this._previousAdNotification = this._createNotification(advert.title, options, false);
        }
        /**
         * Метод вызываемый после события остановки из-за длительного прослушивания в фоне
         */
        _onCrackdown() {
            if (document.hasFocus())
                return;
            const body = getAppString("crackdown-popup", "[feature/crackdown-test]Бесплатно слушать музыку в фоновом режиме можно только 30 минут. Оформите подписку, и музыку ничего не остановит.");
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

    /**
     * Отображает подсказку с текстом над плеером на короткое время
     *
     * @param text Текст в подсказке
     */
    function showNotify(text) {
        const { notify } = getInternalAPI().blocks.blocks;
        notify.show(text);
    }

    const currentVersion = "1.0.4--1574423700689";
    Logger.setBaseName("Yandex.Music MSA");
    const logger$1 = new Logger("Bootstrap");
    logger$1.log("log", "Initializing...");
    tryDetectLocale();
    const metadataUpdater = new MetadataUpdater();
    const controlsUpdater = new ControlsUpdater();
    const notifications$2 = new NowPlayingNotifications();
    const settingsAdditions = new Settings();
    /**
     * Применяет сохранённые настройки
     */
    function applySettings() {
        return __awaiter(this, void 0, void 0, function* () {
            { // Кнопка "Вперёд" в конце плейлиста
                const setting = "lastNextEnabled" /* LatestNext */;
                const value = yield getValueOrDefault(setting, false);
                controlsUpdater.latestNext = value;
                settingsAdditions.settings[setting] = value;
                logger$1.log("log", `Setting "${setting}" applied with value "${value}"`);
            }
            { // Кнопка "Назад" в конце плейлиста
                const setting = "seekBeginningEnabled" /* PreviousSeeking */;
                const value = yield getValueOrDefault(setting, false);
                controlsUpdater.previousSeeking = value;
                settingsAdditions.settings[setting] = value;
                logger$1.log("log", `Setting "${setting}" applied with value "${value}"`);
            }
            { // Уведомления о текущем играющем треке
                const setting = "notificationsEnabled" /* NowPlayingNotify */;
                const value = yield getValueOrDefault(setting, false);
                // TODO: handle whenever `value` and permissions are in conflict (notify user)
                const applied = notifications$2.toggleNotifications(value);
                settingsAdditions.settings[setting] = applied ? value : false;
                logger$1.log("log", `Setting "${setting}" applied with value "${value}"`);
            }
            { // Время, через которое убираются уведомления
                const setting = "notificationsDismissTime" /* NowPlayingNotifyTime */;
                const value = yield getValueOrDefault(setting, NotificationDismissTime.Auto);
                notifications$2.dismissTime = value;
                settingsAdditions.settings[setting] = value;
                logger$1.log("log", `Setting "${setting}" applied with value "${value}"`);
            }
            { // Текущая версия
                const setting = "lastInstalledVersion";
                const firstTime = "first__time";
                const value = yield getValueOrDefault(setting, firstTime);
                if (value !== currentVersion) {
                    const key = value === firstTime
                        ? "installed"
                        : "updated";
                    showNotify(getStringsMap()[key]);
                    yield setValue(setting, currentVersion);
                }
            }
        });
    }
    /**
     * Вешает обработчик события изменения настроек
     */
    function handleSettingsChange() {
        settingsAdditions.settingUpdated.on((setting, val) => __awaiter(this, void 0, void 0, function* () {
            const { settings } = settingsAdditions;
            logger$1.log("log", "Setting changed", setting, val);
            switch (setting) {
                case "lastNextEnabled" /* LatestNext */:
                    {
                        const value = settings[setting];
                        controlsUpdater.latestNext = value;
                        yield setValue(setting, value);
                    }
                    break;
                case "seekBeginningEnabled" /* PreviousSeeking */:
                    {
                        const value = settings[setting];
                        controlsUpdater.previousSeeking = value;
                        yield setValue(setting, value);
                    }
                    break;
                case "notificationsDismissTime" /* NowPlayingNotifyTime */:
                    {
                        const value = settings[setting];
                        notifications$2.dismissTime = value;
                        yield setValue(setting, value);
                    }
                    break;
                case "notificationsEnabled" /* NowPlayingNotify */:
                    {
                        const value = settings[setting];
                        const accepted = notifications$2.toggleNotifications(value);
                        if (!accepted)
                            break;
                        yield setValue(setting, value);
                    }
                    break;
            }
            switch (setting) {
                case "lastNextEnabled" /* LatestNext */:
                case "seekBeginningEnabled" /* PreviousSeeking */:
                    {
                        controlsUpdater.forceUpdate();
                    }
                    break;
            }
        }));
    }
    handleSettingsChange();
    /**
     * Завершает загрузку
     */
    function finishLoading() {
        return __awaiter(this, void 0, void 0, function* () {
            yield applySettings();
            tryDetectLocale();
            metadataUpdater.forceUpdate();
            bindEvents();
            settingsAdditions.bindEvents();
            settingsAdditions.forceUpdateState();
            logger$1.log("log", "PlayerEvent.Ready triggered");
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    if (isPlayerReady())
        finishLoading();
    else
        getExternalAPI().on("ready" /* Ready */, finishLoading);
    metadataUpdater.bindEvents();
    controlsUpdater.bindEvents();
    logger$1.log("log", "Initialization complete");

}());
