<script setup lang="ts">
import {
  format,
  formatISO,
  formatISO9075,
  formatRFC3339,
  formatRFC7231,
  fromUnixTime,
  getTime,
  getUnixTime,
  isDate,
  isValid,
  parseISO,
  parseJSON,
} from 'date-fns';
import type { DateFormat, ToDateMapper } from './date-time-converter.types';
import {
  dateToExcelFormat,
  excelFormatToDate,
  isExcelFormat,
  isISO8601DateTimeString,
  isISO9075DateString,
  isMongoObjectId,
  isRFC3339DateString,
  isRFC7231DateString,
  isTimestamp,
  isUTCDateString,
  isUnixTimestamp,
} from './date-time-converter.models';
import DateTimeConverterSnippet from './date-time-converter-snippet.vue';
import { withDefaultOnError } from '@/utils/defaults';
import { useValidation } from '@/composable/validation';
import { useAppTheme } from '@/ui/theme/themes';

const inputDate = ref('');

const toDate: ToDateMapper = date => new Date(date);

const formats: DateFormat[] = [
  {
    name: 'JS locale date string',
    fromDate: date => date.toString(),
    toDate,
    formatMatcher: () => false,
  },
  {
    name: 'ISO 8601',
    fromDate: formatISO,
    toDate: parseISO,
    formatMatcher: date => isISO8601DateTimeString(date),
  },
  {
    name: 'ISO 9075',
    fromDate: formatISO9075,
    toDate: parseISO,
    formatMatcher: date => isISO9075DateString(date),
  },
  {
    name: 'RFC 3339',
    fromDate: formatRFC3339,
    toDate,
    formatMatcher: date => isRFC3339DateString(date),
  },
  {
    name: 'RFC 7231',
    fromDate: formatRFC7231,
    toDate,
    formatMatcher: date => isRFC7231DateString(date),
  },
  {
    name: 'Unix timestamp',
    fromDate: date => String(getUnixTime(date)),
    toDate: sec => fromUnixTime(+sec),
    formatMatcher: date => isUnixTimestamp(date),
  },
  {
    name: 'Timestamp',
    fromDate: date => String(getTime(date)),
    toDate: ms => parseJSON(+ms),
    formatMatcher: date => isTimestamp(date),
  },
  {
    name: 'UTC format',
    fromDate: date => date.toUTCString(),
    toDate,
    formatMatcher: date => isUTCDateString(date),
  },
  {
    name: 'Mongo ObjectID',
    fromDate: date => `${Math.floor(date.getTime() / 1000).toString(16)}0000000000000000`,
    toDate: objectId => new Date(Number.parseInt(objectId.substring(0, 8), 16) * 1000),
    formatMatcher: date => isMongoObjectId(date),
  },
  {
    name: 'Excel date/time',
    fromDate: date => dateToExcelFormat(date),
    toDate: excelFormatToDate,
    formatMatcher: isExcelFormat,
  },
];

const formatIndex = ref(6);
const now = useNow();

const { t } = useI18n();
const appTheme = useAppTheme();
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

const {
  timestamp: currentTimestamp,
  pause: pauseClock,
  resume: resumeClock,
  isActive: isClockActive,
} = useTimestamp({ controls: true, interval: 1000 });

const currentSeconds = computed(() => Math.floor(currentTimestamp.value / 1000));
const currentLocalTime = computed(() => format(currentTimestamp.value, 'yyyy-MM-dd HH:mm:ss'));

function toggleClock() {
  if (isClockActive.value) {
    pauseClock();
  }
  else {
    resumeClock();
  }
}

function refreshClock() {
  currentTimestamp.value = Date.now();
}

const timestampInput = ref(String(getUnixTime(new Date())));
const timestampUnit = ref<'s' | 'ms'>('s');
const unitOptions = computed(() => [
  { label: t('tools.date-converter.seconds', 'Seconds'), value: 's' },
  { label: t('tools.date-converter.milliseconds', 'Milliseconds'), value: 'ms' },
]);

const timestampDate = computed(() => {
  const raw = timestampInput.value.trim();
  if (!/^-?\d+$/.test(raw)) {
    return undefined;
  }

  const date = timestampUnit.value === 's' ? fromUnixTime(Number(raw)) : new Date(Number(raw));
  return isValid(date) ? date : undefined;
});

const timestampValidation = useValidation({
  source: timestampInput,
  watch: [timestampUnit],
  rules: computed(() => [
    {
      message: t('tools.date-converter.invalid-timestamp', 'Please enter a valid Unix timestamp'),
      validator: (value: string) => value.trim() === '' || timestampDate.value !== undefined,
    },
  ]),
});

const timestampLocalResult = computed(() => (timestampDate.value ? format(timestampDate.value, 'yyyy-MM-dd HH:mm:ss') : ''));
const timestampUtcResult = computed(() => (timestampDate.value ? timestampDate.value.toISOString().slice(0, 19).replace('T', ' ') : ''));

const selectedDateTime = ref<number | null>(Date.now());
const selectedUnixSeconds = computed(() => (selectedDateTime.value === null ? '' : String(Math.floor(selectedDateTime.value / 1000))));
const selectedUnixMilliseconds = computed(() => (selectedDateTime.value === null ? '' : String(selectedDateTime.value)));

function selectCurrentDateTime() {
  selectedDateTime.value = Date.now();
}

const timestampSnippets = [
  { language: 'JavaScript', code: 'Math.floor(Date.now() / 1000)' },
  { language: 'Java', code: 'Instant.now().getEpochSecond()' },
  { language: 'C# / .NET', code: 'DateTimeOffset.UtcNow.ToUnixTimeSeconds()' },
  { language: 'Python', code: 'int(time.time())' },
  { language: 'PHP', code: 'time()' },
  { language: 'Ruby', code: 'Time.now.to_i' },
  { language: 'Go', code: 'time.Now().Unix()' },
  { language: 'MySQL', code: 'SELECT UNIX_TIMESTAMP();' },
  { language: 'PostgreSQL', code: 'SELECT floor(extract(epoch FROM now()));' },
  { language: 'SQL Server', code: 'SELECT DATEDIFF_BIG(SECOND, \'1970-01-01\', SYSUTCDATETIME());' },
  { language: 'Linux / macOS', code: 'date +%s' },
  { language: 'PowerShell', code: '[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()' },
  { language: 'Perl', code: 'time' },
  { language: 'VBScript / ASP', code: 'DateDiff("s", "01/01/1970 00:00:00", Now())' },
];

const dateToTimestampSnippets = [
  { language: 'JavaScript', code: 'Math.floor(new Date(\'2026-10-21T12:00:00\').getTime() / 1000)' },
  { language: 'Java', code: 'LocalDateTime.parse("2026-10-21T12:00:00").atZone(ZoneId.systemDefault()).toEpochSecond()' },
  { language: 'C# / .NET', code: 'DateTimeOffset.Parse("2026-10-21 12:00:00").ToUnixTimeSeconds()' },
  { language: 'Python', code: 'int(datetime.strptime(\'2026-10-21 12:00:00\', \'%Y-%m-%d %H:%M:%S\').timestamp())' },
  { language: 'PHP', code: 'strtotime(\'2026-10-21 12:00:00\')' },
  { language: 'Ruby', code: 'Time.parse(\'2026-10-21 12:00:00\').to_i' },
  { language: 'Go', code: 't, _ := time.ParseInLocation("2006-01-02 15:04:05", "2026-10-21 12:00:00", time.Local); t.Unix()' },
  { language: 'MySQL', code: 'SELECT UNIX_TIMESTAMP(\'2026-10-21 12:00:00\');' },
  { language: 'PostgreSQL', code: 'SELECT extract(epoch FROM timestamp \'2026-10-21 12:00:00\')::bigint;' },
  { language: 'SQL Server', code: 'SELECT DATEDIFF_BIG(SECOND, \'1970-01-01\', \'2026-10-21 12:00:00\');' },
  { language: 'Linux', code: 'date -d \'2026-10-21 12:00:00\' +%s' },
  { language: 'macOS', code: 'date -j -f "%Y-%m-%d %H:%M:%S" "2026-10-21 12:00:00" +%s' },
  { language: 'PowerShell', code: '[DateTimeOffset]::Parse(\'2026-10-21 12:00:00\').ToUnixTimeSeconds()' },
  { language: 'Perl', code: 'Time::Piece->strptime(\'2026-10-21 12:00:00\', \'%Y-%m-%d %H:%M:%S\')->epoch' },
  { language: 'VBScript / ASP', code: 'DateDiff("s", "01/01/1970 00:00:00", "10/21/2026 12:00:00")' },
];

const normalizedDate = computed(() => {
  if (!inputDate.value) {
    return now.value;
  }

  const { toDate } = formats[formatIndex.value];

  try {
    return toDate(inputDate.value);
  }
  catch (_ignored) {
    return undefined;
  }
});

function onDateInputChanged(value: string) {
  const matchingIndex = formats.findIndex(({ formatMatcher }) => formatMatcher(value));
  if (matchingIndex !== -1) {
    formatIndex.value = matchingIndex;
  }
}

const validation = useValidation({
  source: inputDate,
  watch: [formatIndex],
  rules: [
    {
      message: t('tools.date-converter.invalid-date-for-format', 'This date is invalid for this format'),
      validator: value =>
        withDefaultOnError(() => {
          if (value === '') {
            return true;
          }

          const maybeDate = formats[formatIndex.value].toDate(value);
          return isDate(maybeDate) && isValid(maybeDate);
        }, false),
    },
  ],
});

function formatDateUsingFormatter(formatter: (date: Date) => string, date?: Date) {
  if (!date || !validation.isValid) {
    return '';
  }

  return withDefaultOnError(() => formatter(date), '');
}
</script>

<template>
  <div>
    <c-card>
      <div flex flex-wrap items-center gap-x-2 gap-y-3>
        <span text-sm op-60>{{ t('tools.date-converter.current-timestamp', 'Current Unix timestamp') }}</span>
        <span data-test-id="current-unix-timestamp" text-2xl font-semibold leading-none font-mono tabular-nums>{{ currentSeconds }}</span>
        <div ml-auto flex gap-2>
          <c-button size="small" @click="toggleClock">
            {{ isClockActive ? t('tools.date-converter.pause', 'Pause') : t('tools.date-converter.resume', 'Resume') }}
          </c-button>
          <c-button size="small" @click="refreshClock">
            {{ t('tools.date-converter.refresh', 'Refresh') }}
          </c-button>
        </div>
      </div>
      <div mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs op-60>
        <span>{{ currentLocalTime }} ({{ timeZone }})</span>
        <span font-mono>{{ t('tools.date-converter.milliseconds', 'Milliseconds') }}: {{ currentTimestamp }}</span>
      </div>
    </c-card>

    <c-card :title="t('tools.date-converter.timestamp-to-date', 'Unix timestamp to date')" mt-4>
      <div flex gap-2>
        <c-input-text
          v-model:value="timestampInput"
          :placeholder="t('tools.date-converter.timestamp-placeholder', 'e.g. 1792569998')"
          :validation="timestampValidation"
          clearable
          flex-1
          test-id="timestamp-to-date-input"
        />
        <c-select
          v-model:value="timestampUnit"
          :options="unitOptions"
          style="flex: 0 0 110px"
          data-test-id="timestamp-unit-select"
        />
      </div>

      <div grid grid-cols-1 mt-3 gap-3 sm:grid-cols-2>
        <input-copyable
          :label="t('tools.date-converter.local-time', 'Local time')"
          label-position="top"
          :value="timestampLocalResult"
          placeholder="—"
          test-id="timestamp-local-result"
          readonly
        />
        <input-copyable
          :label="t('tools.date-converter.utc-time', 'UTC time')"
          label-position="top"
          :value="timestampUtcResult"
          placeholder="—"
          test-id="timestamp-utc-result"
          readonly
        />
      </div>
      <div mt-2 text-xs op-60>
        {{ t('tools.date-converter.local-timezone', 'Local timezone') }}: {{ timeZone }}
      </div>
    </c-card>

    <c-card :title="t('tools.date-converter.date-to-timestamp', 'Date to Unix timestamp')" mt-4>
      <div flex gap-2>
        <n-date-picker
          v-model:value="selectedDateTime"
          type="datetime"
          clearable
          :placeholder="t('tools.date-converter.date-time-placeholder', 'Pick a date and time')"
          style="flex: 1; min-width: 0"
        />
        <c-button @click="selectCurrentDateTime">
          {{ t('tools.date-converter.now', 'Now') }}
        </c-button>
      </div>

      <div grid grid-cols-1 mt-3 gap-3 sm:grid-cols-2>
        <input-copyable
          :label="t('tools.date-converter.unix-seconds', 'Unix timestamp (seconds)')"
          label-position="top"
          :value="selectedUnixSeconds"
          placeholder="—"
          test-id="date-to-timestamp-seconds"
          readonly
        />
        <input-copyable
          :label="t('tools.date-converter.unix-milliseconds', 'Unix timestamp (milliseconds)')"
          label-position="top"
          :value="selectedUnixMilliseconds"
          placeholder="—"
          test-id="date-to-timestamp-milliseconds"
          readonly
        />
      </div>
      <div mt-2 text-xs op-60>
        {{ t('tools.date-converter.local-timezone', 'Local timezone') }}: {{ timeZone }}
      </div>
    </c-card>

    <n-divider>{{ t('tools.date-converter.more-formats', 'More formats') }}</n-divider>

    <div flex gap-2>
      <c-input-text
        v-model:value="inputDate"
        :placeholder="t('tools.date-converter.input-placeholder', 'Put your date string here...')"
        clearable
        test-id="date-time-converter-input"
        :validation="validation"
        @update:value="onDateInputChanged"
      />

      <c-select
        v-model:value="formatIndex"
        style="flex: 0 0 170px"
        :options="formats.map(({ name }, i) => ({ label: name, value: i }))"
        data-test-id="date-time-converter-format-select"
      />
    </div>

    <input-copyable
      v-for="{ name, fromDate } in formats"
      :key="name"
      :label="name"
      label-width="150px"
      label-position="left"
      label-align="right"
      :value="formatDateUsingFormatter(fromDate, normalizedDate)"
      :placeholder="t('tools.date-converter.invalid-date', 'Invalid date...')"
      :test-id="name"
      readonly
      mt-2
    />

    <c-card mt-4 data-test-id="snippets-card">
      <div class="snippets-title">
        {{ t('tools.date-converter.snippets-title', 'Code examples in different languages') }}
      </div>
      <div class="snippets-subtitle">
        {{ t('tools.date-converter.timestamp-snippets-hint', 'Examples return seconds since the Unix epoch (imports and boilerplate omitted).') }}
      </div>

      <section class="snippets-section">
        <h3 class="snippets-section-title">
          {{ t('tools.date-converter.timestamp-snippets-title', 'How to get the current Unix timestamp in different languages') }}
        </h3>
        <div class="snippets-grid">
          <DateTimeConverterSnippet
            v-for="{ language, code } in timestampSnippets"
            :key="language"
            :language="language"
            :code="code"
          />
        </div>
      </section>

      <section class="snippets-section">
        <h3 class="snippets-section-title">
          {{ t('tools.date-converter.date-to-timestamp-snippets-title', 'How to convert a date/time to a Unix timestamp in different languages') }}
        </h3>
        <div class="snippets-hint">
          {{ t('tools.date-converter.date-to-timestamp-snippets-hint', 'Examples convert the local time 2026-10-21 12:00:00. The result depends on the timezone of the environment.') }}
        </div>
        <div class="snippets-grid">
          <DateTimeConverterSnippet
            v-for="{ language, code } in dateToTimestampSnippets"
            :key="language"
            :language="language"
            :code="code"
          />
        </div>
      </section>
    </c-card>
  </div>
</template>

<style scoped lang="less">
.snippets-title {
  font-size: 16px;
  font-weight: 500;
}

.snippets-subtitle {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: v-bind('appTheme.text.mutedColor');
}

.snippets-section {
  margin-top: 20px;

  & + & {
    padding-top: 20px;
    border-top: 1px dashed v-bind('appTheme.default.colorHover');
  }
}

.snippets-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;

  &::before {
    content: '';
    flex: none;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background-color: v-bind('appTheme.primary.color');
  }
}

.snippets-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.6;
  color: v-bind('appTheme.text.mutedColor');
}

.snippets-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  margin-top: 12px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
