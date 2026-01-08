import { useState, useEffect, useRef } from 'react';
import './App.css';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, type Completion } from '@codemirror/autocomplete';
import { type Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { JSHINT } from 'jshint';
import { ayuLight, coolGlow } from 'thememirror';
import { StepScriptEditorHelper } from './StepScriptEditorHelper';

function App() {
  const [url, setUrl] = useState('');
  const [scriptContent, setScriptContent] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [isDark, setIsDark] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Handle theme change
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  // CodeMirror linter
  const codeLinter = linter(async (view: EditorView): Promise<Diagnostic[]> => {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc;
    const codeContent = doc.toString().trim();
    if (!codeContent) return diagnostics;

    const codes = `(async () => {
${codeContent}
})();`;

    const lintOptions = {
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
    };

    const isPassed = JSHINT(codes, lintOptions);

    if (!isPassed && JSHINT.errors) {
      JSHINT.errors.forEach((err: any) => {
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
  const variableTypes = useRef(new Map<string, string>());
  variableTypes.current.set('ai', 'AIClient');
  variableTypes.current.set('browser', 'Browser');
  variableTypes.current.set('page', 'Page');
  variableTypes.current.set('console', 'Console');

  // Update variable types when code changes
  const updateVariableTypes = (state: EditorState) => {
    const doc = state.doc.toString();
    const varPattern = /(let|const|var)\s+(\w+)\s*=\s*(await\s+)?(.+?)(;|$)/g;
    let match;
    while ((match = varPattern.exec(doc)) !== null) {
      const [, , varName, hasAwait, expr] = match;
      const cleanedExpr = expr.trim().replace(/;$/, '');
      let varType = StepScriptEditorHelper.getExpressionType(cleanedExpr, variableTypes.current);

      if (hasAwait && varType?.startsWith('Promise<')) {
        varType = varType.replace(/^Promise<(.+)>$/, '$1');
      }
      if (varType && StepScriptEditorHelper.TypeDefinitions[varType]) {
        variableTypes.current.set(varName, varType);
      }
    }
  };

  // Create completions for a specific type
  const createCompletions = (typeName: string): Completion[] => {
    if (!typeName || !StepScriptEditorHelper.TypeDefinitions[typeName]) return [];

    const methods = StepScriptEditorHelper.getTypeMethods(typeName);

    return methods.map(method => {
      const paramsStr = method.params.join(', ');
      const label = `${method.name}(${paramsStr})`;
      const info = `${method.name}(${paramsStr}): ${method.returnType}`;

      return {
        label,
        type: "function" as const,
        info,
        apply: (view, _completion, from, to) => {
          const insertText = `${method.name}(${paramsStr})`;
          view.dispatch({
            changes: { from, to, insert: insertText },
            selection: paramsStr
              ? {
                  anchor: from + method.name.length + 1,
                  head: from + insertText.length - 1
                }
              : {
                  anchor: from + insertText.length
                }
          });
        }
      };
    });
  };

  // Create completion source
  const createCompletionSource = () => {
    return (context: { state: EditorState; pos: number }) => {
      const { state, pos } = context;
      const textBefore = state.sliceDoc(0, pos);
      const lastDotIndex = textBefore.lastIndexOf('.');
      const openParenIndex = textBefore.lastIndexOf('(');
      const closeParenIndex = textBefore.lastIndexOf(')');

      // Check if we're after a dot
      if (lastDotIndex === -1 || (openParenIndex > lastDotIndex && closeParenIndex < openParenIndex)) {
        return null;
      }

      const methodPrefix = textBefore.slice(lastDotIndex + 1).trim();
      const leftExpr = textBefore.slice(0, lastDotIndex).trim();
      if (!leftExpr) return null;

      const type = StepScriptEditorHelper.getExpressionType(leftExpr, variableTypes.current);
      if (!type || !StepScriptEditorHelper.TypeDefinitions[type]) return null;

      let completions = createCompletions(type);

      if (methodPrefix) {
        completions = completions.filter(completion =>
          completion.label.toLowerCase().startsWith(methodPrefix.toLowerCase())
        );
      }

      return {
        from: methodPrefix ? lastDotIndex + 1 : pos,
        options: completions
      };
    };
  };

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorRef.current) return;

    const startState = EditorState.create({
      doc: scriptContent,
      extensions: [
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
        autocompletion({
          override: [createCompletionSource()],
          activateOnTyping: true,
          maxRenderedOptions: 20
        }),
        EditorView.lineWrapping,
        isDark ? coolGlow : ayuLight,
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setScriptContent(newContent);
            updateVariableTypes(update.state);
          }
        }),
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px"
          },
          ".cm-scroller": {
            overflow: "auto",
            maxHeight: "400px"
          }
        })
      ]
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [isDark]);

  // Handle script content change
  useEffect(() => {
    if (viewRef.current && viewRef.current.state.doc.toString() !== scriptContent) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: scriptContent
        }
      });
    }
  }, [scriptContent]);

  // Handle install extension button click
  const handleInstallExtension = () => {
    // Open extension installation interface
    window.open('https://chrome.google.com/webstore/category/extensions', '_blank');
  };

  // Handle run script button click
  const handleRunScript = () => {
    // Implement script execution logic here
    console.log('Running script:', scriptContent);
    alert('Script execution initiated! Check console for details.');
  };

  return (
    <div className="workflow-container">
      <h1 className="workflow-title">Web Automation Workflow</h1>
      
      {/* Step 1: Prepare */}
      <div className="workflow-step">
        <div className="step-header">
          <div className="step-number">1</div>
          <h2 className="step-title">准备</h2>
        </div>
        <div className="step-content">
          <button className="install-btn" onClick={handleInstallExtension}>
            Install extension
          </button>
          <p className="step-description">Click the button above to install the required browser extension.</p>
        </div>
      </div>

      {/* Step 2: URL */}
      <div className="workflow-step">
        <div className="step-header">
          <div className="step-number">2</div>
          <h2 className="step-title">URL</h2>
        </div>
        <div className="step-content">
          <div className="url-input-container">
            <input
              type="url"
              id="url-input"
              className="url-input"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <p className="step-description">Enter the URL of the page you want to automate.</p>
        </div>
      </div>

      {/* Step 3: Code */}
      <div className="workflow-step">
        <div className="step-header">
          <div className="step-number">3</div>
          <h2 className="step-title">代码</h2>
        </div>
        <div className="step-content">
          <div className="editor-container" ref={editorRef}></div>
          <p className="step-description">Write your automation script using the CodeMirror editor.</p>
        </div>
      </div>

      {/* Step 4: Execute */}
      <div className="workflow-step">
        <div className="step-header">
          <div className="step-number">4</div>
          <h2 className="step-title">执行</h2>
        </div>
        <div className="step-content">
          <button className="run-btn" onClick={handleRunScript}>
            Run
          </button>
          <p className="step-description">Click the button above to execute your automation script.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
