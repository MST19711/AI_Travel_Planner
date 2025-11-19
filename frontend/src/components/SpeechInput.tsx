import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { speechService, SpeechRecognitionResult, SpeechRecognitionService } from '../services/speechService';
import userService from '../services/userService';

interface SpeechInputProps {
  onTextChange: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const SpeechInput: React.FC<SpeechInputProps> = ({
  onTextChange,
  placeholder = "点击麦克风开始语音输入...",
  disabled = false,
  className = ""
}) => {
  const { user } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentText, setCurrentText] = useState('');
  const [isConfigComplete, setIsConfigComplete] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const textRef = useRef('');

  // 检查配置和支持状态
  useEffect(() => {
    const checkConfigAndSupport = async () => {
      try {
        // 检查浏览器支持
        setIsSupported(SpeechRecognitionService.isSupported());
        
        if (user) {
          // 获取API密钥配置
          const apiKeys = await userService.getApiKeys();
          setIsConfigComplete(SpeechRecognitionService.isConfigComplete(apiKeys));
          speechService.setConfig(apiKeys);
        }
      } catch (error) {
        console.error('检查语音配置失败:', error);
        setError('获取API配置失败');
      }
    };

    checkConfigAndSupport();
  }, [user]);

  // 处理语音识别结果
  const handleSpeechResult = (result: SpeechRecognitionResult) => {
    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.text) {
      // 如果是最终结果，替换整个文本
      if (result.isFinal) {
        textRef.current = result.text;
        setCurrentText(result.text);
        onTextChange(result.text);
      } else {
        // 如果是中间结果，追加到当前文本
        textRef.current = result.text;
        setCurrentText(result.text);
      }
    }
  };

  // 开始语音识别
  const startRecording = async () => {
    if (!isSupported) {
      setError('浏览器不支持语音识别功能');
      return;
    }

    if (!isConfigComplete) {
      setError('请先在设置页面配置讯飞语音API密钥');
      return;
    }

    if (disabled) {
      return;
    }

    setIsLoading(true);
    setError('');
    setCurrentText('');
    textRef.current = '';

    try {
      await speechService.startRecognition({
        onStart: () => {
          setIsRecording(true);
          setIsLoading(false);
        },
        onResult: handleSpeechResult,
        onEnd: () => {
          setIsRecording(false);
        },
        onError: (errorMsg) => {
          setError(errorMsg);
          setIsRecording(false);
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('开始语音识别失败:', error);
      setError('开始语音识别失败，请检查麦克风权限');
      setIsLoading(false);
    }
  };

  // 停止语音识别
  const stopRecording = () => {
    if (isRecording) {
      speechService.stopRecognition();
      setIsRecording(false);
    }
  };

  // 处理手动输入
  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setCurrentText(text);
    onTextChange(text);
  };

  if (!isSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-yellow-800">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>您的浏览器不支持语音识别功能</span>
        </div>
      </div>
    );
  }

  if (!isConfigComplete) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center text-yellow-800">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>请先在设置页面配置讯飞语音API密钥以启用语音输入功能</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 输入框和语音按钮 */}
      <div className="flex space-x-3">
        <div className="flex-1">
          <input
            type="text"
            value={currentText}
            onChange={handleManualInput}
            placeholder={placeholder}
            disabled={disabled || isRecording}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
        
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || isLoading || !isConfigComplete}
          className={`
            flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200
            ${isRecording 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
            ${disabled || isLoading || !isConfigComplete 
              ? 'bg-gray-400 cursor-not-allowed' 
              : ''
            }
          `}
          title={isRecording ? '停止录音' : '开始录音'}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 状态指示器 */}
      {isRecording && (
        <div className="flex items-center space-x-2 text-blue-600">
          <div className="flex space-x-1">
            <div className="w-2 h-4 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-6 bg-blue-600 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-4 bg-blue-600 rounded-full animate-pulse delay-150"></div>
          </div>
          <span className="text-sm font-medium">正在录音中...</span>
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>{error}</span>
        </div>
      )}

      {/* 使用说明 */}
      {!isRecording && !error && (
        <div className="text-gray-500 text-sm">
          <p>点击麦克风按钮开始语音输入，支持中文普通话识别</p>
        </div>
      )}
    </div>
  );
};

export default SpeechInput;