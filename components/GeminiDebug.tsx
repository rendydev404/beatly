import { useState, useEffect } from 'react';

export default function GeminiDebug() {
  const [debugInfo, setDebugInfo] = useState<{
    status: string;
    config: any;
    error?: string;
  } | null>(null);

  const [geminiTest, setGeminiTest] = useState<{
    status: string;
    error?: string;
    latency?: number;
  } | null>(null);

  useEffect(() => {
    // Check configuration
    fetch('/api/debug-gemini')
      .then(res => res.json())
      .then(data => setDebugInfo(data))
      .catch(err => setDebugInfo({ status: 'error', config: null, error: err.message }));
  }, []);

  const testGeminiAPI = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/gemini/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      const latency = Date.now() - startTime;

      if (!response.ok) {
        setGeminiTest({
          status: 'error',
          error: data.error || 'Unknown error',
          latency,
        });
      } else {
        setGeminiTest({
          status: 'success',
          latency,
        });
      }
    } catch (err: any) {
      setGeminiTest({
        status: 'error',
        error: err.message,
        latency: Date.now() - startTime,
      });
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900/95 p-4 rounded-lg border border-primary/20 shadow-xl max-w-sm">
      <h3 className="text-white font-bold mb-2">Gemini Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <p className="text-gray-400">Configuration Status:</p>
          <p className={`font-mono ${debugInfo?.status === 'ready' ? 'text-green-400' : 'text-red-400'}`}>
            {debugInfo?.status || 'Loading...'}
          </p>
        </div>

        {debugInfo?.config?.gemini && (
          <div>
            <p className="text-gray-400">Gemini API Key:</p>
            <p className={`font-mono ${debugInfo.config.gemini.valid ? 'text-green-400' : 'text-red-400'}`}>
              {debugInfo.config.gemini.valid ? 'Valid' : 'Invalid/Missing'}
            </p>
          </div>
        )}

        <div>
          <button
            onClick={testGeminiAPI}
            className="bg-primary/20 hover:bg-primary/30 text-white px-3 py-1 rounded-md text-sm transition-colors"
          >
            Test Gemini API
          </button>

          {geminiTest && (
            <div className="mt-2">
              <p className="text-gray-400">Test Result:</p>
              <p className={`font-mono ${geminiTest.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {geminiTest.status === 'success' ? 'Success' : 'Failed'}
                {geminiTest.latency && ` (${geminiTest.latency}ms)`}
              </p>
              {geminiTest.error && (
                <p className="text-red-400 text-xs mt-1 break-all">
                  Error: {geminiTest.error}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => document.querySelector('.gemini-debug')?.remove()}
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}