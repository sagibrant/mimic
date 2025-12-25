<!-- StepResult.vue -->
<template>
  <div class="result-tab content-panel">
    <div class="property-row">
      <label class="property-label">{{ t('step_result_label_description') }}</label>
      <div class="property-value">{{ currentStepResult?.step_description || '' }}</div>
    </div>

    <div class="property-row">
      <label class="property-label">{{ t('step_result_label_start_time') }}</label>
      <div class="property-value">{{ currentStepResult?.step_start_time || '' }}</div>
    </div>

    <div class="property-row">
      <label class="property-label">{{ t('step_result_label_end_time') }}</label>
      <div class="property-value">{{ currentStepResult?.step_end_time || '' }}</div>
    </div>

    <div class="property-row">
      <label class="property-label">{{ t('step_result_label_status') }}</label>
      <div class="property-value" :class="currentStepResult?.status">
        {{ currentStepResult?.status === 'passed' ? t('step_result_label_passed') :
          currentStepResult?.status === 'failed' ? t('step_result_label_failed') :
            currentStepResult?.status === 'pending' ? t('step_result_label_pending') : t('step_result_label_none') }}
      </div>
    </div>

    <div class="property-row">
      <label class="property-label">{{ t('step_result_label_error') }}</label>
      <div class="property-value error-message">{{ currentStepResult?.error || '' }}</div>
    </div>

    <div class="property-row">
      <label class="property-label">{{ t('step_result_label_screenshot') }}</label>
      <div class="screenshot-container" v-if="currentStepResult?.screenshot">
        <img :src="currentStepResult.screenshot" alt="Step execution screenshot" class="screenshot-thumbnail"
          @click="showFullScreenshot">
      </div>
      <div class="property-value" v-else>{{ t('step_result_label_noScreenshot') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, PropType } from 'vue';
import { StepResult } from '../../execution/Task';

// Define component props with type annotations
const props = defineProps({
  result: {
    type: Object as PropType<StepResult>,
    required: true,
    description: 'The result of the step'
  }
});

const emit = defineEmits<{
  (e: 'show-notification-message', message: string): void;
}>();

const currentStepResult = ref<StepResult | undefined>(undefined);

// Methods
/**
 * Get localized text by key
 * @param key - The key of the text to localize
 * @returns Localized text string
 */
const t = (key: string) => {
  return chrome.i18n.getMessage(key) || key; // Fallback to key if message not found
};

/**
 * Handle full screenshot display
 */
const showFullScreenshot = () => {
  emit('show-notification-message', 'Screenshot enlarged - mock implementation');
};

onMounted(() => {
  currentStepResult.value = props.result;
});

</script>

<style scoped>
.result-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.property-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.property-label {
  min-width: 60px;
  font-weight: 500;
  color: #555;
}

.property-value {
  flex: 1;
  padding: 8px;
  color: #333;
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  min-height: 34px;
  box-sizing: border-box;
}

.property-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-height: 34px;
  box-sizing: border-box;
}

.property-input:focus {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  outline: none;
}

.textarea-input {
  resize: vertical;
  min-height: 80px;
}

/* Result tab specific styles */
.result-value.pass {
  color: #4caf50;
}

.result-value.fail {
  color: #f44336;
}

.result-value.pending {
  color: #ff9800;
}

.error-message {
  color: #f44336;
  white-space: pre-wrap;
}

.screenshot-container {
  flex: 1;
}

.screenshot-thumbnail {
  max-width: 100%;
  max-height: 150px;
  border-radius: 4px;
  cursor: pointer;
  transition: transform 0.2s;
  border: 1px solid #e0e0e0;
}

.screenshot-thumbnail:hover {
  transform: scale(1.02);
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {


  .tab-btn {
    color: #bbb;
  }

  .tab-btn.active {
    color: #82b1ff;
    border-bottom-color: #3f51b5;
  }

  .tab-btn:hover:not(.active) {
    color: #fff;
    background-color: rgba(255, 255, 255, 0.08);
  }

  .property-label,
  .form-label,
  .result-label {
    color: #bbb;
  }

  .property-value {
    color: #555;
  }

  .property-input,
  .form-select,
  .form-textarea {
    border-color: #555;
    background-color: #2d2d2d;
    color: #e0e0e0;
  }

  .property-input:disabled {
    background-color: #2d2d2d;
    color: #757575;
  }

  .result-value {
    background-color: #2d2d2d;
  }

  .result-value.pass {
    color: #81c784;
    background-color: #2e7d321a;
  }

  .result-value.fail {
    color: #e57373;
    background-color: #c628281a;
  }

  .screenshot-thumbnail {
    border-color: #555;
  }
}
</style>