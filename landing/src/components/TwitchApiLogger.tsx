// src/components/TwitchApiLogger.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FaChevronDown, FaChevronUp, FaTrash, FaDownload, FaCode } from 'react-icons/fa';

// Define TypeScript interfaces for log entries
interface LogEntry {
  id: string;
  timestamp: string;
  type: 'request' | 'response' | 'error';
  endpoint: string;
  method?: string;
  status?: number;
  data: unknown;
}

const TwitchApiLogger: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(process.env.NODE_ENV === 'development');
  const [isMinimized, setIsMinimized] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Function to intercept fetch/XHR calls
  useEffect(() => {
    if (!isVisible) return;

    // Save original fetch
    const originalFetch = window.fetch;

    // Override fetch
    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Only log Twitch API calls
      if (!url.includes('twitch.tv') && !url.includes('/api/twitch')) {
        return originalFetch(input, init);
      }

      const method = init?.method || 'GET';
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Log request
      const requestEntry: LogEntry = {
        id: requestId,
        timestamp: new Date().toISOString(),
        type: 'request',
        endpoint: url,
        method,
        data: init?.body ? JSON.parse(typeof init.body === 'string' ? init.body : '{}') : {}
      };
      
      setLogs(prevLogs => [...prevLogs, requestEntry]);

      try {
        // Actual fetch call
        const response = await originalFetch(input, init);
        
        // Clone the response so we can read its body
        const clonedResponse = response.clone();
        let responseData;
        
        try {
          responseData = await clonedResponse.json();
        } catch (e) {
          responseData = { note: 'Unable to parse response as JSON' };
        }
        
        // Log response
        const responseEntry: LogEntry = {
          id: `${requestId}_response`,
          timestamp: new Date().toISOString(),
          type: 'response',
          endpoint: url,
          status: response.status,
          data: responseData
        };
        
        setLogs(prevLogs => [...prevLogs, responseEntry]);
        
        return response;
      } catch (error) {
        // Log error
        const errorEntry: LogEntry = {
          id: `${requestId}_error`,
          timestamp: new Date().toISOString(),
          type: 'error',
          endpoint: url,
          data: error
        };
        
        setLogs(prevLogs => [...prevLogs, errorEntry]);
        throw error;
      }
    };

    // Cleanup
    return () => {
      window.fetch = originalFetch;
    };
  }, [isVisible]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isExpanded]);

  const clearLogs = () => {
    setLogs([]);
  };

  const downloadLogs = () => {
    const logData = JSON.stringify(logs, null, 2);
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twitch-api-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

      if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 left-4 w-12 h-12 rounded-full bg-electric-blue flex items-center justify-center cursor-pointer z-50 shadow-lg hover:bg-neon-cyan transition-colors"
        onClick={() => setIsMinimized(false)}
        title="Show Twitch API Logger"
      >
        <FaCode size={20} color="#000" />
        {logs.length > 0 && (
          <span className="absolute -top-2 -left-2 bg-bright-purple text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {logs.length > 99 ? '99+' : logs.length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 w-full md:w-96 z-50">
      <div className="bg-gray-900 border border-electric-blue shadow-lg rounded-t-lg overflow-hidden">
        <div 
          className="flex justify-between items-center p-2 bg-electric-blue/20 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center text-electric-blue">
            <span className="font-cyber text-sm mr-2">Twitch API Logger</span>
            <span className="text-xs bg-electric-blue/30 px-2 py-0.5 rounded-full">{logs.length}</span>
          </div>
          <div className="flex items-center">
            <button 
              onClick={(e) => { e.stopPropagation(); clearLogs(); }} 
              className="text-gray-400 hover:text-red-400 mr-2"
              title="Clear logs"
            >
              <FaTrash size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); downloadLogs(); }} 
              className="text-gray-400 hover:text-electric-blue mr-2"
              title="Download logs"
            >
              <FaDownload size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} 
              className="text-gray-400 hover:text-bright-purple mr-2"
              title="Minimize"
            >
              <FaCode size={12} />
            </button>
            {isExpanded ? <FaChevronDown /> : <FaChevronUp />}
          </div>
        </div>
        
        {isExpanded && (
          <div 
            ref={logContainerRef}
            className="max-h-96 overflow-y-auto text-xs font-mono"
            style={{ backgroundColor: '#0a0a0a' }}
          >
            {logs.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">No Twitch API calls logged yet</div>
            ) : (
              logs.map(entry => (
                <div 
                  key={entry.id} 
                  className={`p-2 border-b border-gray-800 ${
                    entry.type === 'request' 
                      ? 'bg-gray-900' 
                      : entry.type === 'response' 
                        ? (entry.status && entry.status >= 400 
                            ? 'bg-red-900/30' 
                            : 'bg-green-900/20')
                        : 'bg-red-900/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      entry.type === 'request' 
                        ? 'bg-blue-800/50 text-blue-300' 
                        : entry.type === 'response' 
                          ? (entry.status && entry.status >= 400 
                              ? 'bg-red-800/50 text-red-300' 
                              : 'bg-green-800/50 text-green-300')
                          : 'bg-red-800/50 text-red-300'
                    }`}>
                      {entry.type.toUpperCase()}
                      {entry.status && ` ${entry.status}`}
                    </span>
                    <span className="text-gray-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex flex-wrap items-center mb-1">
                    {entry.method && (
                      <span className="mr-2 px-1 bg-gray-800 text-gray-300 rounded">
                        {entry.method}
                      </span>
                    )}
                    <span className="text-gray-300 truncate" title={entry.endpoint}>
                      {entry.endpoint.replace(/^https?:\/\/[^/]+\//, '/')}
                    </span>
                  </div>
                  <div className="mt-1 text-gray-400 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(entry.data, null, 2)}</pre>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TwitchApiLogger;