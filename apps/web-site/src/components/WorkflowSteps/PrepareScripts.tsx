import React, { useEffect, useRef, useState } from 'react';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { javascript } from '@codemirror/lang-javascript';
import { autocompletion, type Completion } from '@codemirror/autocomplete';
import { type Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { syntaxTree } from '@codemirror/language';
import { JSHINT } from 'jshint';
import { ayuLight, coolGlow } from 'thememirror';
import { StepScriptEditorHelper } from '../../utils/StepScriptEditorHelper';

interface PrepareScriptsProps {
  stepNumber: number;
  isDark: boolean;
  initialScriptContent: string;
  onScriptChange: (content: string) => void;
}

const PrepareScripts: React.FC<PrepareScriptsProps> = ({ 
  stepNumber, 
  isDark, 
  initialScriptContent, 
  onScriptChange 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [scriptContent, setScriptContent] = useState(initialScriptContent);

  // Variable types map
  const variableTypes = useRef(new Map<string, string>());
  variableTypes.current.set('ai', 'AIClient');
  variableTypes.current.set('browser', 'Browser');
  variableTypes.current.set('page', 'Page');
  variableTypes.current.set('console', 'Console');

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

      const type = StepScriptEditorHelper.getExpressionType(leftExpr, variableTypes.current);
      if (!type || !StepScriptEditorHelper.TypeDefinitions[type]) return null;

      let completions = createCompletions(type);

      if (methodPrefix) {
        completions = completions.filter(completion =>
          completion.label.toLowerCase().startsWith(methodPrefix)
        );
      }
      return {
        from: methodPrefix ? dotPos + 1 : pos,
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
            onScriptChange(newContent);
            updateVariableTypes(update.state);
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

  // Handle script content change from parent
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

  return (
    <div className="workflow-step">
      <div className="step-header">
        <div className="step-number">{stepNumber}</div>
        <h2 className="step-title">Script</h2>
      </div>
      <div className="step-content">
        <div className="editor-container" ref={editorRef}></div>
        <p className="step-description">
          Write your automation script using the editor.
        </p>
      </div>
    </div>
  );
};

export default PrepareScripts;