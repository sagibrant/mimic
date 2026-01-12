import { useState, useEffect, useRef, useImperativeHandle } from 'react';
import './StepScriptEditor.css';
import { EditorView } from '@codemirror/view';
import { StepScriptEditorHelper } from './StepScriptEditorHelper';
import { ObjectDescription, Step } from '../../execution/Task';

interface StepScriptEditorProps {
  step: Step;
  inspectedElement: ObjectDescription | undefined
  toggleInspectMode: () => Promise<void>;
}

export default function StepScriptEditor({
  step,
  inspectedElement,
  toggleInspectMode
}: StepScriptEditorProps) {
  // State
  const [isDark, setIsDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [editorContent, setEditorContent] = useState(step.script);

  // Refs
  const codemirrorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  // Localization helper
  const t = (key: string) => {
    return chrome.i18n.getMessage(key) || key;
  };

  // Update editor content when step.script changes
  useEffect(() => {
    setEditorContent(step.script);
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: step.script
        }
      });
    }
  }, [step.script]);

  // Update step.script when editor content changes
  useEffect(() => {
    step.script = editorContent;
  }, [editorContent, step]);

  // Handle dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!codemirrorRef.current) return;

    const startState = StepScriptEditorHelper.createCodeMirrorEditorView(editorContent, isDark, (script) => {
      setEditorContent(script);
    });
    const editorView = new EditorView({
      state: startState,
      parent: codemirrorRef.current
    });

    editorViewRef.current = editorView;

    return () => {
      editorView.destroy();
    };
  }, [isDark]);

  const handleInspect = async () => {
    await toggleInspectMode();
  };

  // Expose addStepScript method for parent components
  useImperativeHandle(undefined, () => ({
    addStepScript(script: string) {
      setEditorContent(pre => pre + '\n' + script);
    }
  }));

  return (
    <div className="step-script-container">
      {/* script editor with codemirror */}
      <div className="editor-section">
        <div className="editor-header">
          <label className="editor-label">{t('step_script_editor_scripts_title')}</label>
          <div>
            <button
              className="btn btn-inspect"
              onClick={handleInspect}
              title={inspectedElement === null ? t('step_script_editor_btn_title_inspect') : JSON.stringify(inspectedElement, null, 2)}
            >
              {inspectedElement === null ? "⛶" : "▣"}
            </button>
          </div>
        </div>
        <div className="editor-container">
          <div ref={codemirrorRef}></div>
        </div>
      </div>
    </div>
  );
};

