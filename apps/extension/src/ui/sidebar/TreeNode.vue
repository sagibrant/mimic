<!-- TreeNode.vue -->
<template>
  <div class="tree-node">
    <!-- Main node content with click handling -->
    <div class="node-content" @click.stop="handleClick" @dblclick.stop="handleDoubleClick">
      <!-- Indentation guides to visually represent hierarchy levels -->
      <div class="indent-guide" v-for="(_, index) in depth" :key="index" :class="{ 'last': index === depth - 1 }"></div>

      <!-- Expand/collapse icon for group nodes -->
      <span class="node-icon" v-if="node.type === 'group'">
        {{ isExpanded ? '▼' : '▶' }}
      </span>
      <!-- Empty space for non-group nodes to maintain alignment -->
      <!-- <span class="node-icon" v-else>&nbsp;</span> -->

      <!-- Node label with type-specific icon -->
      <span class="node-label" :class="{ 'active': isActive }" v-if="!isEditing">
        <span class="node-type-icon">
          {{ node.type === 'group' ? '📁' : '📄' }}
        </span>
        <span class="node-name">
          {{ node.name }}
        </span>
      </span>

      <!-- Editable input for node name -->
      <span class="node-edit" v-if="isEditing">
        <input type="text" v-model="editedName" @keydown.enter="saveName" @blur="saveName" @keydown.esc="cancelEdit"
          ref="editInput">
      </span>
    </div>

    <!-- Container for child nodes, only visible if expanded -->
    <div v-if="node.type === 'group' && isExpanded && node.children" class="node-children">
      <tree-node v-for="child in node.children" :key="child.id" :node="child" :active-node-id="activeNodeId"
        :depth="depth + 1" @node-selected="handleChildSelect" @rename-node="handleRenameNode" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, PropType, nextTick } from 'vue';

export interface TreeNode {
  id: string;
  name: string;
  type: 'group' | 'task';
  children?: TreeNode[];
}

// Define component props with type annotations
const props = defineProps({
  /** The node data to be rendered */
  node: {
    type: Object as PropType<TreeNode>,
    required: true,
    description: 'The tree node data including id, name, type, and children (for groups)'
  },
  /** ID of the currently active/selected node */
  activeNodeId: {
    type: String,
    required: true,
    description: 'ID of the currently active/selected node in the tree'
  },
  /** Depth level in the tree hierarchy (for indentation) */
  depth: {
    type: Number,
    default: 0,
    description: 'Depth of the node in the tree hierarchy, used for indentation'
  }
});

// Define component emission events
const emit = defineEmits<{
  (e: 'node-selected', nodeId: string): void;
  (e: 'rename-node', nodeId: string, newName: string): void;
}>();

/** Reactive state to control if the node is expanded (for groups) */
const isExpanded = ref(props.node.type === 'group' ? true : false);
/** Reactive state to control edit mode */
const isEditing = ref(false);
/** Edited name during renaming */
const editedName = ref('');
/** Reference to edit input element */
const editInput = ref<HTMLInputElement | null>(null);

/**
 * Check if the current node is the active/selected one
 * @returns Boolean indicating if current node is active
 */
const isActive = computed(() => {
  return props.node.id === props.activeNodeId;
});

/**
 * Handle click events on the node
 * - Toggles expansion for group nodes
 * - Emits selection event for task nodes
 */
const handleClick = () => {
  if (props.node.type === 'group') {
    isExpanded.value = !isExpanded.value;
  }
  emit('node-selected', props.node.id);
};

/**
 * Handle double click for editing node name
 */
const handleDoubleClick = () => {
  isEditing.value = true;
  editedName.value = props.node.name;

  // Focus input after it's rendered
  nextTick(() => {
    editInput.value?.focus();
  });
};

/**
 * Save edited node name
 */
const saveName = () => {
  const trimmedName = editedName.value.trim();
  if (trimmedName && trimmedName !== props.node.name) {
    emit('rename-node', props.node.id, trimmedName);
  }
  isEditing.value = false;
};

/**
 * Cancel editing
 */
const cancelEdit = () => {
  isEditing.value = false;
};

/**
 * Propagate child node selection events up the hierarchy
 * @param nodeId - ID of the selected child node
 */
const handleChildSelect = (nodeId: string) => {
  emit('node-selected', nodeId);
};

/**
 * Propagate rename node event
 * @param nodeId - Node ID to rename
 * @param newName - New name for the node
 */
const handleRenameNode = (nodeId: string, newName: string) => {
  emit('rename-node', nodeId, newName);
};
</script>

<style scoped>
 /* Prevent text selection on node */
.tree-node {
  user-select: none;
}

.node-content {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  cursor: pointer;
  border-radius: 2px;
  transition: background-color 0.2s;
  max-width: 160px;
}

/* Hover effect for better interactivity */
.node-content:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Styling for indentation guide lines */
.indent-guide {
  position: relative;
  width: 16px;
  height: 20px;
}

/* Vertical guide lines for non-last items in hierarchy */
.indent-guide:not(.last)::before {
  display: none;
}

/* Horizontal guide lines for non-last items in hierarchy */
.indent-guide:not(.last)::after {
  display: none;
}

/* Vertical guide lines for last items in hierarchy */
.indent-guide.last::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 0;
  height: 50%;
  width: 1px;
  background-color: #ddd;
}

/* Horizontal guide lines for last items in hierarchy */
.indent-guide.last::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 10px;
  width: 8px;
  height: 1px;
  background-color: #ddd;
}

/* Expand/collapse icon styling */
.node-icon {
  display: inline-block;
  width: 16px;
  text-align: center;
  color: #666;
  font-size: 14px;
  line-height: 1;
}

/* File/folder type icon styling */
.node-type-icon {
  display: inline-block;
  width: 16px;
  text-align: center;
  font-style: normal;
}

.node-label {
  padding: 2px 4px;
  flex: 1;
  line-height: 1;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  word-break: break-word;
}

.node-name {
  flex: 1;
  padding: 0;
  white-space: normal;
  word-break: break-word;
}

/* Styling for active/selected node 
  background-color: #2196f3;
*/
.node-label.active {
  color: #2196f3;
  border-radius: 2px;
  background-color: rgba(33, 150, 243, 0.08);
}

/* Container for child nodes */
.node-children {
  margin-left: 0;
  padding-left: 0;
}


/* node editor */
.node-edit input {
  padding: 2px 4px;
  width: 120px;
}

/* Dark mode adaptations */
@media (prefers-color-scheme: dark) {
  .node-content:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .node-icon {
    color: #aaa;
  }

  /* Dark mode guide lines */
  .indent-guide.last::before,
  .indent-guide.last::after {
    background-color: #444;
  }

  .node-label.active {
    color: #82b1ff;
    background-color: rgba(33, 150, 243, 0.15);
  }
}
</style>