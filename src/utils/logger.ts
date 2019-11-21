const $LOGGER_NAME = Symbol("loggerName");
const $BASE_NAME = Symbol("baseLoggerName");

/**
 * Представляет собой тип записи в логе
 */
type LogVerbosity = "log" | "error" | "warn";

/**
 * Представляет собой "журнал", в который записываются полезные (и нет) данные
 */
export class Logger {
	/**
	 * Создаёт новый лог
	 *
	 * @param loggerName Название этого отдельного лога
	 */
	constructor(loggerName: string) {
		this[$LOGGER_NAME] = `[${loggerName}]`;
	}

	/**
	 * Название этого отдельного лога
	 */
	private [$LOGGER_NAME]: string;

	/**
	 * Создаёт новую запись в логе
	 *
	 * @param verbosity Тип записи в логе
	 * @param args Аргументы для записи в лог
	 */
	public log(verbosity: LogVerbosity, ...args: any[]) {
		const log = console[verbosity];

		const baseName = Logger[$BASE_NAME];

		if (baseName != null) {
			log(baseName, this[$LOGGER_NAME], ...args);
		} else {
			log(this[$LOGGER_NAME], ...args);
		}
	}

	/**
	 * Создаёт новую запись в логе, а затем выводит стек вызовов
	 *
	 * @param verbosity Тип записи в логе
	 * @param args Аргументы для записи в лог
	 */
	public trace(verbosity: LogVerbosity, ...args: any[]) {
		this.log(verbosity, ...args);

		console.trace();
	}

	/**
	 * Префикс для записей в общий лог
	 */
	private static [$BASE_NAME]?: string;

	/**
	 * Устанавливает префикс для записей в общий лог,
	 * он будет отображаться перед самой записью
	 *
	 * @param baseName Префикс для записей в общий лог
	 */
	public static setBaseName(baseName: string) {
		Logger[$BASE_NAME] = `[${baseName}]`;
	}
}
