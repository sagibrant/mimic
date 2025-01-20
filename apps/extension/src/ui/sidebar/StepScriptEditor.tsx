/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file StepScriptEditor.tsx
 * @description 
 * Sidebar step script editor component
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState, useEffect, useRef, useImperativeHandle, useCallback, useMemo } from 'react';
import './StepScriptEditor.css';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor, placeholder } from '@codemirror/view';
import { Compartment, EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, type Completion } from '@codemirror/autocomplete';
import { type Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import { JSHINT, LintError, LintOptions } from 'jshint';
import { ayuLight, coolGlow } from 'thememirror';
import { MethodDefinition, StepScriptEditorHelper } from './StepScriptEditorHelper';
import { SidebarUtils } from './SidebarUtils';
import { ElementInfo } from '@gogogo/shared';
import { Button } from '@/ui/components/ui/button';
import { Label } from '@/ui/components/ui/label';

// Define the interface for the exposed methods
export interface StepScriptEditorRef {
  addStepScript(script: string): void;
}

interface StepScriptEditorProps {
  ref: React.RefObject<StepScriptEditorRef | null>;
  initialScriptContent: string;
  onScriptChange: (content: string) => void;
  runScript: () => Promise<void>;
}

export default function StepScriptEditor({
  ref,
  initialScriptContent,
  onScriptChange,
  runScript
}: StepScriptEditorProps) {
  // State
  const [isDark, setIsDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [scriptContent, setScriptContent] = useState(initialScriptContent);
  const [inspectedObject, setInspectedObject] = useState<ElementInfo | undefined>(undefined);
  const [draggedInspectedObject, setDraggedInspectedObject] = useState<ElementInfo | undefined>(undefined);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  /**
   * Localization helper
   */
  const t = useCallback((key: string) => {
    return chrome.i18n.getMessage(key) || key;
  }, []);

  const themeCompartment = useMemo(() => {
    return new Compartment();
  }, []);

  // Toggle inspect mode
  const handleToggleInspectMode = useCallback(async () => {
    await SidebarUtils.engine.toggleInspectMode();
  }, []);

  const handleDragStart = useCallback((inspectedObject?: ElementInfo) => {
    setDraggedInspectedObject(inspectedObject);
  }, []);

  const handleDrop = useCallback((inspectedObject?: ElementInfo) => {
    if (!inspectedObject || inspectedObject !== draggedInspectedObject) return;
    const scripts: string[] = [];
    if (inspectedObject.browserScript) scripts.push(inspectedObject.browserScript);
    if (inspectedObject.pageScript) scripts.push(inspectedObject.pageScript);
    if (inspectedObject.frameScript) scripts.push(inspectedObject.frameScript);
    if (inspectedObject.elementScript) scripts.push(inspectedObject.elementScript);
    scripts.push('highlight()');
    const stepScript = 'await ' + scripts.join('.') + ';';
    setScriptContent(pre => pre ? pre + '\n' + stepScript : stepScript);
    setDraggedInspectedObject(undefined);
    const scrollContainer = editorViewRef.current?.scrollDOM;
    if (!scrollContainer) return;
    scrollContainer.scrollTop = scrollContainer.scrollHeight;
  }, [draggedInspectedObject]);

  // Initialize CodeMirror editor
  useEffect(() => {
    console.log('Initialize CodeMirror editor ==> useEffect');
    if (!editorRef.current) return;

    // Code linter
    const codeLinter = linter(async (view: EditorView): Promise<Diagnostic[]> => {
      const diagnostics: Diagnostic[] = [];
      const doc = view.state.doc;
      const codeContent = doc.toString().trim();
      if (!codeContent) return diagnostics;

      //  or add /* jshint -W083 */
      const codes = `(async () => {
${codeContent}
})();`;

      const lintOptions: LintOptions = {
        esversion: 11,
        browser: true,
        devel: true,
        undef: true,
        unused: true,
        eqeqeq: true,
        curly: true,
        globals: {
          ai: true,
          browser: true,
          page: true,
          BrowserLocator: true,
          expect: true,
          wait: true
        }
        // '-W083': true
      };

      const isPassed = JSHINT(codes, lintOptions);

      if (!isPassed && JSHINT.errors) {
        JSHINT.errors.forEach((err: LintError | null) => {
          if (!err) return;
          const targetLineNum = err.line - 1;
          if (targetLineNum < 1 || targetLineNum > doc.lines) return;
          const targetLine = doc.line(targetLineNum);
          const errorStart = targetLine.from + (err.character - 1);
          const errorEnd = err.evidence
            ? errorStart + err.evidence.length
            : errorStart + 1;

          diagnostics.push({
            from: errorStart,
            to: errorEnd,
            message: err.reason,
            severity: err.code && err.code.startsWith('W') ? 'warning' : (err.code && err.code.startsWith('E') ? 'error' : "info")
          });
        });
      }

      return diagnostics;
    }, { delay: 1000 });

    // Variable types map
    const variableTypes = new Map<string, string>();
    variableTypes.set('ai', 'AIClient');
    variableTypes.set('browser', 'Browser');
    variableTypes.set('page', 'Page');
    variableTypes.set('console', 'Console');
    // update the Variable types map
    const updateVariableTypes = (state: EditorState) => {
      const doc = state.doc.toString();
      const varPattern = /(let|const|var)\s+(\w+)\s*=\s*(await\s+)?(.+?)(;|$)/g;
      let match;
      while ((match = varPattern.exec(doc)) !== null) {
        const [, , varName, hasAwait, expr] = match;
        const cleanedExpr = expr.trim().replace(/;$/, '');
        let varType = StepScriptEditorHelper.getExpressionType(cleanedExpr, variableTypes);

        if (hasAwait && varType?.startsWith('Promise<')) {
          varType = varType.replace(/^Promise<(.+)>$/, '$1');
        }
        if (varType && StepScriptEditorHelper.TypeDefinitions[varType]) {
          variableTypes.set(varName, varType);
        }
      }
    };

    // Create completions for a specific type
    const createCompletions = (typeName: string): Completion[] => {
      if (!typeName || !StepScriptEditorHelper.TypeDefinitions[typeName]) return [];

      const methods = StepScriptEditorHelper.getTypeMethods(typeName);
      const properties = StepScriptEditorHelper.getTypeProperties(typeName);

      const methodCompletions = methods.map((method: MethodDefinition) => {
        const paramsStr = method.params.join(', ');
        const label = `${method.name}(${paramsStr})`;
        const info = `${method.name}(${paramsStr}): ${method.returnType}`;

        return {
          label,
          type: "function",
          info,
          apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
            const insertText = `${method.name}(${paramsStr})`;
            view.dispatch({
              changes: { from, to, insert: insertText },
              selection: paramsStr
                ? {
                  // move the cursor select all the parameters:  ([aaa,bbb,ccc]) 
                  anchor: from + method.name.length + 1,
                  head: from + insertText.length - 1
                }
                : {
                  // move the cursor after the ()|
                  anchor: from + insertText.length
                }
            });
          }
        };
      });

      const propertyCompletions = properties.map((prop) => {
        const info = `${prop.name}${prop.optional ? "?" : ""}: ${prop.type}`;
        return {
          label: prop.name,
          type: "property",
          info,
          apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
            view.dispatch({
              changes: { from, to, insert: prop.name },
              selection: { anchor: from + prop.name.length }
            });
          }
        };
      });

      return [...propertyCompletions, ...methodCompletions];
    };

    // Create completion source
    const createCompletionSource = () => {
      return (context: { state: EditorState; pos: number }) => {
        const { state, pos } = context;
        const tree = syntaxTree(state);
        const nodeBefore = tree.resolveInner(pos, -1);
        if (!nodeBefore) return null;
        if (!nodeBefore.parent) return null;
        // we only support the auto completion on one object. global variable is not supported
        // e.g.
        // expr: let elm = await page.frame().nth(0).element().nth(1).element().filter().nth(1).element('#id').cl
        // leftExpr: "page.frame().nth(0).element().nth(1).element().filter().nth(1).element('#id')"
        // methodPrefix: cl

        // try to find the dot '.'
        const textBefore = state.sliceDoc(nodeBefore.from, nodeBefore.to).trim();
        let dotPos = -1;
        if (textBefore === ".") {
          dotPos = nodeBefore.from;
        }
        else if (nodeBefore.from > 0) {
          const dotText = state.sliceDoc(nodeBefore.from - 1, nodeBefore.from).trim();
          if (dotText === '.') {
            dotPos = nodeBefore.from - 1;
          }
        }
        if (dotPos < 0) {
          return null;
        }
        const methodPrefix = state.sliceDoc(dotPos + 1, nodeBefore.to).trim();
        const leftExpr = state.sliceDoc(nodeBefore.parent.from, dotPos).trim();
        if (!leftExpr) return null;

        const type = StepScriptEditorHelper.getExpressionType(leftExpr, variableTypes);
        if (!type || !StepScriptEditorHelper.TypeDefinitions[type]) return null;

        let completions = createCompletions(type);

        if (methodPrefix) {
          completions = completions.filter((completion: Completion) =>
            completion.label.toLowerCase().startsWith(methodPrefix)
          );
        }
        return {
          from: methodPrefix ? dotPos + 1 : pos,
          options: completions
        };
      };
    };

    const staticExtensions = [
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      drawSelection(),
      dropCursor(),
      rectangularSelection(),
      crosshairCursor(),
      javascript(),
      codeLinter,
      lintGutter(),
      placeholder(t('step_script_editor_scripts_placeholder')),
      autocompletion({
        override: [createCompletionSource()],
        activateOnTyping: true,
        maxRenderedOptions: 20
      }),
      EditorView.lineWrapping,
      // scrollPastEnd(),
      EditorView.updateListener.of(update => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString();
          setScriptContent(newContent);
          onScriptChange(newContent);
          updateVariableTypes(update.state);
        }
      })
    ];

    // Create Start State
    const startState = EditorState.create({
      doc: scriptContent,
      extensions: [
        ...staticExtensions,
        themeCompartment.of(isDark ? coolGlow : ayuLight)
      ]
    });

    const editorView = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    editorViewRef.current = editorView;

    const onNodeInspected = async ({ details }: { details: ElementInfo }) => {
      setInspectedObject(details);
    };
    SidebarUtils.handler.on('nodeInspected', onNodeInspected);

    return () => {
      editorView.destroy();
      SidebarUtils.handler.off('nodeInspected', onNodeInspected);
    };
  }, [onScriptChange]);

  // Handle script content change from parent (addStepScript)
  useEffect(() => {
    if (editorViewRef.current && editorViewRef.current.state.doc.toString() !== scriptContent) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: scriptContent
        }
      });
    }
  }, [scriptContent]);

  // Handle dark mode changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!editorViewRef.current) return;

    editorViewRef.current.dispatch({
      effects: themeCompartment.reconfigure(isDark ? coolGlow : ayuLight)
    });

  }, [isDark]);

  // Expose addStepScript method for parent components
  useImperativeHandle(ref, () => {
    return {
      addStepScript(script: string) {
        setScriptContent(pre => pre ? pre + '\n' + script : script);
        const scrollContainer = editorViewRef.current?.scrollDOM;
        if (!scrollContainer) return;
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, []);

  return (
    <div className="step-script-container">
      {/* script editor with codemirror */}
      <div className="editor-section">
        <div className="editor-header">
          <Label className="editor-label">{t('step_script_editor_scripts_title')}</Label>
          <div>
            <Button
              variant="ghost"
              size="icon-sm"
              draggable="true"
              onClick={handleToggleInspectMode}
              onDragStart={(e: React.DragEvent) => {
                e.stopPropagation();
                handleDragStart(inspectedObject);
              }}
              title={!inspectedObject ? t('step_script_editor_btn_title_inspect') : JSON.stringify(inspectedObject.element, null, 2)}
            >
              {!inspectedObject ? "⛶" : "▣"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={runScript}
              title={t('step_script_editor_btn_title_run_script')}
            >
              ▷
            </Button>
          </div>
        </div>
        <div className="editor-container" ref={editorRef}
          onDragOver={(e: React.DragEvent) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onDrop={(e: React.DragEvent) => {
            e.stopPropagation();
            handleDrop(inspectedObject);
          }}
        >
        </div>
      </div>
    </div>
  );
};
