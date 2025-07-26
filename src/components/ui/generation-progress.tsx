import React from 'react';
import { Loader2Icon, CheckCircleIcon, XCircleIcon, Sparkles, Code2, Palette, Smartphone, Zap } from 'lucide-react';

interface GenerationProgressProps {
  status: 'idle' | 'generating' | 'completed' | 'error';
  message: string;
  features?: string[];
  estimatedTime?: string;
  error?: string;
}

export function GenerationProgress({ 
  status, 
  message, 
  features = [], 
  estimatedTime,
  error 
}: GenerationProgressProps) {
  if (status === 'idle') return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'generating':
        return <Loader2Icon className="w-6 h-6 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-6 h-6 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'generating':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const featureIcons = [
    <Palette className="w-4 h-4" />,
    <Code2 className="w-4 h-4" />,
    <Zap className="w-4 h-4" />,
    <Smartphone className="w-4 h-4" />,
    <Sparkles className="w-4 h-4" />
  ];

  return (
    <div className={`p-6 rounded-xl border-2 transition-all duration-300 ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-4">
        {getStatusIcon()}
        <div>
          <h3 className="font-semibold text-lg">
            {status === 'generating' && 'Building Your App'}
            {status === 'completed' && 'App Ready!'}
            {status === 'error' && 'Generation Failed'}
          </h3>
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>

      {status === 'generating' && (
        <>
          {estimatedTime && (
            <div className="mb-4 p-3 bg-white rounded-lg border">
              <p className="text-sm text-gray-600">
                ⏱️ Estimated time: <span className="font-medium">{estimatedTime}</span>
              </p>
            </div>
          )}

          {features.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Building with:</p>
              <div className="grid gap-2">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 bg-white rounded-lg border text-sm animate-pulse"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <span className="text-blue-500">
                      {featureIcons[index % featureIcons.length]}
                    </span>
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </>
      )}

      {status === 'completed' && (
        <div className="p-3 bg-white rounded-lg border">
          <p className="text-sm text-green-700">
            ✅ Your app has been generated successfully! Check the preview tab to see your creation.
          </p>
        </div>
      )}

      {status === 'error' && error && (
        <div className="p-3 bg-white rounded-lg border">
          <p className="text-sm text-red-700">
            ❌ {error}
          </p>
        </div>
      )}
    </div>
  );
}