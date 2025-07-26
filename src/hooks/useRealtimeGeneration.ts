import { useState, useEffect, useCallback } from 'react';

interface GenerationState {
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
  features?: string[];
  estimatedTime?: string;
  fragment?: {
    id: string;
    title: string;
    files: Record<string, string>;
  };
  error?: string;
}

export function useRealtimeGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    message: ''
  });

  const generateCode = useCallback(async (prompt: string, projectId: string) => {
    setState(prev => ({
      ...prev,
      status: 'generating',
      message: 'Starting code generation...',
      error: undefined
    }));

    try {
      // Start generation
      const response = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, projectId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      setState(prev => ({
        ...prev,
        status: 'generating',
        message: data.message,
        features: data.features,
        estimatedTime: data.estimatedTime
      }));

      // Poll for completion
      const pollForCompletion = async () => {
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max
        
        const poll = async (): Promise<void> => {
          if (attempts >= maxAttempts) {
            setState(prev => ({
              ...prev,
              status: 'error',
              message: 'Generation timed out. Please try again.',
              error: 'Timeout'
            }));
            return;
          }

          attempts++;

          try {
            const statusResponse = await fetch(`/api/generate-code?projectId=${projectId}`);
            const statusData = await statusResponse.json();

            if (statusData.status === 'completed') {
              setState(prev => ({
                ...prev,
                status: 'completed',
                message: statusData.message,
                fragment: statusData.fragment
              }));
            } else if (statusData.status === 'generating') {
              setState(prev => ({
                ...prev,
                message: statusData.message || `Still generating... (${attempts * 2}s)`
              }));
              
              // Continue polling
              setTimeout(poll, 2000);
            }
          } catch (error) {
            console.error('Polling error:', error);
            // Continue polling on error (network issues, etc.)
            setTimeout(poll, 2000);
          }
        };

        poll();
      };

      pollForCompletion();

    } catch (error) {
      setState(prev => ({
        ...prev,
        status: 'error',
        message: 'Failed to start generation',
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      message: ''
    });
  }, []);

  return {
    ...state,
    generateCode,
    reset,
    isGenerating: state.status === 'generating',
    isCompleted: state.status === 'completed',
    hasError: state.status === 'error'
  };
}