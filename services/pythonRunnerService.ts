import { ExecutionResult, OnUserInput } from '../types';

declare global {
    interface Window {
        loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    }
}

let pyodide: any = null;
let pyodideReadyPromise: Promise<void> | null = null;
let loaderReadyPromise: Promise<void> | null = null;
let progressCallback: (message: string) => void = () => {};
let userInputCallback: OnUserInput = async () => '';

const PACKAGES = [
    'numpy',
    'pandas',
    'matplotlib',
];

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';
const PYODIDE_SCRIPT_URL = `${PYODIDE_URL}pyodide.js`;
const DEFAULT_TIMEOUT_MS = 7000;
const LOADER_READY_TIMEOUT_MS = 15000;

const SAFETY_PRELUDE = `
import builtins

_PYTHONIC_BLOCKED_IMPORTS = {
    "socket",
    "requests",
    "urllib",
    "http",
    "ftplib",
    "telnetlib",
    "asyncio",
    "subprocess",
}

_pythonic_original_import = builtins.__import__

def _pythonic_safe_import(name, *args, **kwargs):
    root = name.split(".")[0]
    if root in _PYTHONIC_BLOCKED_IMPORTS:
        raise ImportError(f"Import '{root}' is disabled in this sandbox.")
    return _pythonic_original_import(name, *args, **kwargs)

builtins.__import__ = _pythonic_safe_import
`;

const configureStdin = () => {
    pyodide.setStdin({
        stdin: (promptText: string) => userInputCallback(promptText),
    });
};

const getLoadPyodide = (): ((config: { indexURL: string }) => Promise<any>) | null => {
    const candidate = (globalThis as any)?.loadPyodide ?? window.loadPyodide;
    return typeof candidate === 'function' ? candidate : null;
};

const ensurePyodideLoader = async (): Promise<void> => {
  if (getLoadPyodide()) {
    return;
  }

    if (loaderReadyPromise) {
        return loaderReadyPromise;
    }

    loaderReadyPromise = new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${PYODIDE_SCRIPT_URL}"]`);
        if (existingScript) {
            let done = false;
            const finish = (finalizer: () => void) => {
                if (done) return;
                done = true;
                clearTimeout(timeoutId);
                existingScript.removeEventListener('load', onLoad);
                existingScript.removeEventListener('error', onError);
                finalizer();
            };
            const tryResolve = () => {
                if (getLoadPyodide()) {
                    finish(() => resolve());
                    return true;
                }
                return false;
            };
            const onLoad = () => {
                if (!tryResolve()) {
                    finish(() => reject(new Error('Pyodide script loaded but loadPyodide() was not found on window.')));
                }
            };
            const onError = () => {
                finish(() => reject(new Error(`Failed to load ${PYODIDE_SCRIPT_URL}`)));
            };
            const timeoutId = setTimeout(() => {
                finish(() => reject(new Error('Timed out waiting for Pyodide loader to become available.')));
            }, LOADER_READY_TIMEOUT_MS);

            existingScript.addEventListener('load', onLoad);
            existingScript.addEventListener('error', onError);
            queueMicrotask(() => {
                tryResolve();
            });
            return;
        }

        const script = document.createElement('script');
        script.src = PYODIDE_SCRIPT_URL;
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            if (getLoadPyodide()) {
                resolve();
            } else {
                reject(new Error('Pyodide script loaded but loadPyodide() was not exposed.'));
            }
        };
        script.onerror = () => reject(new Error(`Failed to load ${PYODIDE_SCRIPT_URL}`));
        document.head.appendChild(script);
    });

    loaderReadyPromise = loaderReadyPromise.catch((error) => {
        loaderReadyPromise = null;
        throw error;
    });
    return loaderReadyPromise;
};

const bootstrapPyodide = async () => {
    progressCallback('Preparing Pyodide loader...');
    await ensurePyodideLoader();
    const loadPyodide = getLoadPyodide();
    if (!loadPyodide) {
        throw new Error('loadPyodide() is unavailable after script load.');
    }

    progressCallback('Loading Python interpreter...');
    pyodide = await loadPyodide({ indexURL: PYODIDE_URL });

    progressCallback('Loading lesson packages...');
    await pyodide.loadPackage(PACKAGES);

    configureStdin();
    await pyodide.runPythonAsync(SAFETY_PRELUDE);
    progressCallback('Python environment is ready.');
};

const initPyodide = (onProgress: (message: string) => void, onUserInput: OnUserInput): Promise<void> => {
    progressCallback = onProgress;
    userInputCallback = onUserInput;

    if (!pyodideReadyPromise) {
        pyodideReadyPromise = bootstrapPyodide().catch((error) => {
            pyodideReadyPromise = null;
            throw error;
        });
    }

    return pyodideReadyPromise;
};

const resetPyodide = async (): Promise<void> => {
    pyodide = null;
    pyodideReadyPromise = null;
    await initPyodide(progressCallback, userInputCallback);
};

const runWithTimeout = async (operation: Promise<void>, timeoutMs: number): Promise<{ timedOut: boolean }> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
        await Promise.race([
            operation,
            new Promise<never>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('Execution timed out.')), timeoutMs);
            }),
        ]);
        return { timedOut: false };
    } finally {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }
};

const runPythonCode = async (
    code: string,
    options?: { timeoutMs?: number }
): Promise<ExecutionResult> => {
    if (!pyodide) {
        throw new Error('Pyodide is not initialized yet.');
    }

    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const wrappedScript = `
import io
import contextlib
import traceback
import ast

__pythonic_out = io.StringIO()
__pythonic_err = io.StringIO()
__pythonic_source = ${JSON.stringify(code)}

with contextlib.redirect_stdout(__pythonic_out), contextlib.redirect_stderr(__pythonic_err):
    try:
        __pythonic_ns = {}
        __pythonic_tree = ast.parse(__pythonic_source, mode="exec")
        if __pythonic_tree.body and isinstance(__pythonic_tree.body[-1], ast.Expr):
            __pythonic_last_expr = __pythonic_tree.body.pop()
            if __pythonic_tree.body:
                exec(compile(__pythonic_tree, "<user_code>", "exec"), __pythonic_ns, __pythonic_ns)
            __pythonic_last_value = eval(
                compile(ast.Expression(__pythonic_last_expr.value), "<user_code>", "eval"),
                __pythonic_ns,
                __pythonic_ns,
            )
            if __pythonic_last_value is not None:
                print(repr(__pythonic_last_value))
        else:
            exec(compile(__pythonic_tree, "<user_code>", "exec"), __pythonic_ns, __pythonic_ns)

        if not __pythonic_out.getvalue().strip() and not __pythonic_err.getvalue().strip():
            __pythonic_preview = []
            for __name, __value in __pythonic_ns.items():
                if __name.startswith("_"):
                    continue
                if callable(__value):
                    continue
                if isinstance(__value, (int, float, bool, str)):
                    __pythonic_preview.append(f"{__name} = {__value!r}")
                elif isinstance(__value, (list, tuple, set, dict)):
                    __repr = repr(__value)
                    if len(__repr) <= 120:
                        __pythonic_preview.append(f"{__name} = {__repr}")
                if len(__pythonic_preview) >= 3:
                    break

            if __pythonic_preview:
                print("No stdout. Variable snapshot:")
                for __line in __pythonic_preview:
                    print(__line)
    except Exception:
        traceback.print_exc()

__pythonic_result = {
    "output": __pythonic_out.getvalue(),
    "error": __pythonic_err.getvalue(),
}
`;

    const start = performance.now();

    try {
        const { timedOut } = await runWithTimeout(pyodide.runPythonAsync(wrappedScript), timeoutMs);
        const durationMs = Math.round(performance.now() - start);

        const proxy = pyodide.globals.get('__pythonic_result');
        let result = proxy;
        if (proxy?.toJs) {
            try {
                result = proxy.toJs({ dict_converter: Object.fromEntries });
            } catch {
                result = proxy.toJs();
            }
        }
        proxy?.destroy?.();

        const readField = (source: any, key: 'output' | 'error') => {
            if (source instanceof Map) {
                return source.get(key);
            }
            return source?.[key];
        };

        const outputValue = readField(result, 'output');
        const errorValue = readField(result, 'error');

        await pyodide.runPythonAsync(`
for _name in (
    "__pythonic_out",
    "__pythonic_err",
    "__pythonic_source",
    "__pythonic_ns",
    "__pythonic_tree",
    "__pythonic_last_expr",
    "__pythonic_last_value",
    "__pythonic_preview",
    "__name",
    "__value",
    "__repr",
    "__line",
    "__pythonic_result",
):
    globals().pop(_name, None)
globals().pop("_name", None)
`);

        return {
            output: String(outputValue ?? '').trimEnd(),
            error: errorValue ? String(errorValue).trim() : null,
            durationMs,
            timedOut,
        };
    } catch (e: any) {
        const durationMs = Math.round(performance.now() - start);
        const timedOut = String(e?.message ?? '').toLowerCase().includes('timed out');
        if (timedOut) {
            await resetPyodide();
        }
        return {
            output: '',
            error: timedOut
                ? 'Execution timed out and the Python runtime was reset. Try a smaller loop or safer base case.'
                : String(e?.message ?? 'Execution failed.'),
            durationMs,
            timedOut,
        };
    }
};

const isRunnerReady = (): boolean => Boolean(pyodide);

export { initPyodide, resetPyodide, runPythonCode, isRunnerReady };
