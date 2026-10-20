<script setup lang="ts">
import JSON5 from 'json5';
import convert from 'xml-js';
import { useStorage } from '@vueuse/core';
import { sortObjectKeys } from './json.models';
import { useValidation } from '@/composable/validation';
import TextareaCopyable from '@/components/TextareaCopyable.vue';

type Mode = 'format' | 'minify' | 'escape' | 'unescape' | 'toXml';

const { t } = useI18n();
const inputElement = ref<HTMLElement>();

const rawJson = useStorage('json-prettify:raw-json', '{"hello": "world", "foo": "bar"}');
const indentSize = useStorage('json-prettify:indent-size', 3);
const sortKeys = useStorage('json-prettify:sort-keys', true);
const mode = useStorage<Mode>('json-prettify:mode', 'format');
const fullscreen = ref(false);

const modes = computed<Mode[]>(() => ['format', 'minify', 'escape', 'unescape', 'toXml']);
const modeLabel = (m: Mode) => t(`tools.json-prettify.button.${m}`);

const parse = (text: string) => JSON5.parse(text);

// 每个模式只负责把左侧源码变成右侧结果，左侧内容保持原样
function transform(text: string): string {
  switch (mode.value) {
    case 'format': {
      const parsed = parse(text);
      return JSON.stringify(sortKeys.value ? sortObjectKeys(parsed) : parsed, null, indentSize.value);
    }
    case 'minify':
      return JSON.stringify(parse(text));
    case 'escape':
      return JSON.stringify(text.trim());
    case 'unescape': {
      const unescaped = JSON.parse(text.trim());
      if (typeof unescaped !== 'string') {
        throw new TypeError(t('tools.json-prettify.invalidUnescape'));
      }
      return unescaped;
    }
    case 'toXml':
      return convert.js2xml(parse(text), { compact: true, spaces: 2 });
    default:
      return '';
  }
}

const result = computed(() => {
  if (rawJson.value.trim() === '') {
    return { value: '', error: '' };
  }
  try {
    return { value: transform(rawJson.value), error: '' };
  }
  catch (e) {
    return { value: '', error: e instanceof Error ? e.message : String(e) };
  }
});

const rawJsonValidation = useValidation({
  source: rawJson,
  rules: [
    {
      validator: v => v === '' || JSON5.parse(v),
      message: t('tools.json-prettify.invalidJson'),
    },
  ],
});

const clearText = () => {
  rawJson.value = '';
};
</script>

<template>
  <div class="json-prettify" :class="{ fullscreen }" style="flex: 0 0 100%">
    <div class="toolbar">
      <div class="toolbar-group">
        <c-button size="small" secondary @click="clearText"> {{ $t('tools.json-prettify.button.clear') }} </c-button>
      </div>

      <div class="toolbar-group">
        <c-button
          v-for="m in modes"
          :key="m"
          size="small"
          secondary
          :type="mode === m ? 'primary' : 'default'"
          @click="mode = m"
        >
          {{ modeLabel(m) }}
        </c-button>

        <label class="control">
          {{ $t('tools.json-prettify.sortKeys') }} :
          <n-switch v-model:value="sortKeys" size="small" />
        </label>
        <label class="control">
          {{ $t('tools.json-prettify.indentSize') }} :
          <n-input-number v-model:value="indentSize" min="0" max="10" size="small" style="width: 80px" />
        </label>
        <c-button size="small" secondary @click="fullscreen = !fullscreen">
          {{ fullscreen ? $t('tools.json-prettify.button.exitFullscreen') : $t('tools.json-prettify.button.fullscreen') }}
        </c-button>
      </div>
    </div>

    <div class="editor-grid">
      <section class="pane">
        <div class="pane-title">
          {{ $t('tools.json-prettify.rawJson') }}
        </div>
        <c-input-text
          ref="inputElement"
          v-model:value="rawJson"
          :placeholder="$t('tools.json-prettify.rawJsonPlaceholder')"
          :rows="fullscreen ? 32 : 20"
          :validation="rawJsonValidation"
          multiline
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          monospace
        />
      </section>
      <section class="pane">
        <div class="pane-title">
          {{ $t('tools.json-prettify.prettified') }}
        </div>
        <!-- 传组件实例量不到高度，要用它 expose 出来的元素 -->
        <TextareaCopyable :value="result.value" language="json" :follow-height-of="inputElement?.inputWrapperRef" />
        <div v-if="result.error" class="pane-feedback">
          {{ result.error }}
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="less" scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin-bottom: 12px;
}

.toolbar-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;

  &:last-child {
    margin-left: auto;
  }
}

.control {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  white-space: nowrap;
  color: var(--n-label-text-color, inherit);
}

// 输入框：不软换行，超长行横向滚动（c-input-text 默认是 pre-wrap）
.editor-grid :deep(textarea) {
  white-space: pre !important;
  word-break: normal !important;
  overflow-wrap: normal !important;
  overflow-x: auto !important;
}

// 输出：n-code 默认会折行，这里改成不换行 + 横向滚动
.editor-grid :deep(.n-code) {
  white-space: pre !important;
  overflow-x: auto !important;
  margin: 0;
}

// 输入/输出左右并排；窄屏自动回到上下布局
.editor-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

// 两栏统一用自绘标题，保证顶部严格对齐（n-form-item 的标签行高会随文案变）
.pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

// 输入框和输出区撑满整栏高度，两栏才能底部对齐
.pane > :nth-child(2) {
  flex: 1;
  min-height: 0;
}

// 输出卡片撑满整栏（c-card 是 it-tools 自己的卡片组件，不是 naive 的 n-card）
.pane :deep(.c-card) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.pane :deep(.n-scrollbar) {
  flex: 1;
}

.pane-title {
  height: 22px;
  line-height: 22px;
  margin-bottom: 5px;
  font-size: 14px;
  color: var(--n-label-text-color, inherit);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pane-feedback {
  margin-top: 4px;
  font-size: 12px;
  color: var(--n-error-color, #d03050);
}

// 全屏：盖住整个视口（含侧边栏），滚动内部处理
.fullscreen {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow: auto;
  padding: 24px;
  background: var(--n-body-color, var(--n-color, #fff));
}
</style>
