<script setup lang="ts">
import { useCopy } from '@/composable/copy';
import { useAppTheme } from '@/ui/theme/themes';

const props = defineProps<{ language: string; code: string }>();
const { language, code } = toRefs(props);

const { t } = useI18n();
const { copy, isJustCopied } = useCopy({ source: code, createToast: false });
const appTheme = useAppTheme();

const tooltipText = computed(() =>
  isJustCopied.value
    ? t('tools.date-converter.copied', 'Copied!')
    : t('tools.date-converter.copy-code', 'Copy code'),
);
</script>

<template>
  <div class="snippet">
    <div class="snippet-header">
      <span class="snippet-language">{{ language }}</span>
      <c-tooltip :tooltip="tooltipText">
        <c-button circle variant="text" size="small" :aria-label="tooltipText" @click="copy()">
          <icon-mdi-content-copy v-if="!isJustCopied" />
          <icon-mdi-check v-else />
        </c-button>
      </c-tooltip>
    </div>
    <code class="snippet-code">{{ code }}</code>
  </div>
</template>

<style scoped lang="less">
.snippet {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 8px 10px 10px;
  background-color: v-bind('appTheme.default.color');
  border: 1px solid transparent;
  border-radius: 8px;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: v-bind('appTheme.primary.colorFaded');
  }
}

.snippet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 24px;
}

.snippet-language {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 0 8px;
  overflow: hidden;
  color: v-bind('appTheme.primary.color');
  background-color: v-bind('appTheme.primary.colorFaded');
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.snippet-code {
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: v-bind('appTheme.text.baseColor');
  overflow-wrap: anywhere;
}
</style>
