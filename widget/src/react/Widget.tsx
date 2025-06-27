import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CSSProperties } from 'react';

export interface WidgetProps {
  /**
   * API endpoint for the @usewayn/server provider
   */
  api: string;
  
  /**
   * Theme mode for the widget
   */
  color?: 'light' | 'dark';
  
  /**
   * Number of workers to use for PoW solving
   */
  workerCount?: number;
  
  /**
   * Callback fired when the CAPTCHA is successfully solved
   */
  onSolve?: (token: string) => void;
  
  /**
   * Callback fired during solving progress
   */
  onProgress?: (progress: number) => void;
  
  /**
   * Callback fired when an error occurs
   */
  onError?: (error: string) => void;
  
  /**
   * Callback fired when the widget is reset
   */
  onReset?: () => void;
  
  /**
   * Custom CSS class name
   */
  className?: string;
  
  /**
   * Custom styles
   */
  style?: CSSProperties;
  
  /**
   * Whether the widget is disabled
   */
  disabled?: boolean;
  
  /**
   * Custom internationalization texts
   */
  i18n?: {
    initialState?: string;
    verifying?: string;
    verified?: string;
    error?: string;
  };
}

export const Widget: React.FC<WidgetProps> = ({
  api,
  color = 'light',
  workerCount = navigator.hardwareConcurrency || 4,
  onSolve,
  onProgress,
  onError,
  onReset,
  className = '',
  style,
  disabled = false,
  i18n = {}
}) => {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import the core widget to avoid SSR issues
    const setupWidget = async () => {
      // Import the core widget
      await import('../core');
      
      if (widgetRef.current) {
        const widget = widgetRef.current;
        
        // Set up event listeners
        if (onSolve) {
          widget.addEventListener('wayn:solve', (event: CustomEvent) => {
            onSolve(event.detail.token);
          });
        }
        
        if (onProgress) {
          widget.addEventListener('wayn:progress', (event: CustomEvent) => {
            onProgress(event.detail.progress);
          });
        }
        
        if (onError) {
          widget.addEventListener('wayn:error', (event: CustomEvent) => {
            onError(event.detail.error);
          });
        }
        
        if (onReset) {
          widget.addEventListener('wayn:reset', onReset);
        }
      }
    };

    setupWidget();
  }, [onSolve, onProgress, onError, onReset]);

  const widgetProps: any = {
    api,
    color,
    'worker-count': workerCount,
  };

  if (disabled) {
    widgetProps.disabled = '';
  }

  if (i18n.initialState) {
    widgetProps['data-i18n-initial-state'] = i18n.initialState;
  }
  if (i18n.verifying) {
    widgetProps['data-i18n-verifying'] = i18n.verifying;
  }
  if (i18n.verified) {
    widgetProps['data-i18n-verified'] = i18n.verified;
  }
  if (i18n.error) {
    widgetProps['data-i18n-error'] = i18n.error;
  }

  return React.createElement(
    'wayn-widget',
    {
      ref: widgetRef,
      className,
      style,
      ...widgetProps
    }
  );
};

export default Widget;
