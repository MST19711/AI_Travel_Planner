import {useAuthStore} from '../stores/authStore';
import {ApiKeys} from '../types';

// import userService from './userService';

// 语音识别服务配置
interface SpeechRecognitionConfig {
  appId: string;
  apiKey: string;
  apiSecret: string;
}

// 语音识别结果
export interface SpeechRecognitionResult {
  text: string;
  isFinal: boolean;
  error?: string;
}

// 语音识别事件回调
export interface SpeechRecognitionCallbacks {
  onResult: (result: SpeechRecognitionResult) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

class SpeechRecognitionService {
  private ws: WebSocket|null = null;
  private audioContext: AudioContext|null = null;
  private processor: ScriptProcessorNode|null = null;
  private callbacks: SpeechRecognitionCallbacks|null = null;
  private isRecording = false;
  private config: SpeechRecognitionConfig|null = null;

  // 生成鉴权URL
  // private generateAuthUrl(): string {
  //   if (!this.config) throw new Error('语音识别配置未设置');

  //   const host = 'iat-api.xfyun.cn';
  //   const date = new Date().toUTCString();
  //   const requestLine = 'GET /v2/iat HTTP/1.1';

  //   // 生成签名原始字符串
  //   const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;
  //   console.log('签名原始字符串:', signatureOrigin);

  //   // 使用HMAC-SHA256生成签名
  //   const hash = CryptoJS.HmacSHA256(signatureOrigin, this.config.apiSecret);
  //   const signature = CryptoJS.enc.Base64.stringify(hash);
  //   console.log('生成的签名:', signature);

  //   // 生成authorization原始字符串 - 确保没有换行符
  //   const authorizationOrigin = `api_key="${
  //       this.config
  //           .apiKey}", algorithm="hmac-sha256", headers="host date
  //           request-line", signature="${
  //       signature}"`;
  //   console.log('Authorization原始字符串:', authorizationOrigin);

  //   // Base64编码authorization
  //   const authorization = btoa(authorizationOrigin);
  //   console.log('Base64编码的Authorization:', authorization);

  //   // URL编码参数
  //   const params = new URLSearchParams({host, date, authorization});

  //   const finalUrl = `wss://${host}/v2/iat?${params.toString()}`;
  //   console.log('最终WebSocket URL:', finalUrl);

  //   return finalUrl;
  // }

  // 设置配置
  setConfig(apiKeys: ApiKeys): void {
    if (!apiKeys.xunfeiAppId || !apiKeys.xunfeiApiKey ||
        !apiKeys.xunfeiApiSecret) {
      throw new Error('讯飞语音API配置不完整');
    }

    this.config = {
      appId: apiKeys.xunfeiAppId,
      apiKey: apiKeys.xunfeiApiKey,
      apiSecret: apiKeys.xunfeiApiSecret
    };
  }

  // 初始化WebSocket连接
  private async initWebSocket(): Promise<void> {
    if (!this.config) throw new Error('语音识别配置未设置');

    return new Promise((resolve, reject) => {
      try {
        // 使用后端代理服务 - 使用相对路径连接
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;  // 使用当前页面的主机
        const url = `${protocol}//${host}/api/speech/recognize`;
        console.log('连接到后端语音服务:', url);

        this.ws = new WebSocket(url);

        this.ws.onopen = async () => {
          console.log('WebSocket连接已建立，发送认证信息');
          try {
            // 发送认证信息
            const authData = {
              user_id: useAuthStore.getState().user?.id || 0,
              api_keys: {
                xunfei_app_id: this.config!.appId,
                xunfei_api_key: this.config!.apiKey,
                xunfei_api_secret: this.config!.apiSecret
              }
            };
            this.ws!.send(JSON.stringify(authData));

            // 等待认证成功
            setTimeout(() => {
              console.log('认证完成，发送初始帧');
              this.sendInitialFrame();
              resolve();
            }, 100);
          } catch (error) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket错误详情:', error);
          const errorMessage = `WebSocket连接错误: ${error.type || '未知错误'}`;
          this.callbacks?.onError?.(errorMessage);
          reject(new Error(errorMessage));
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket连接已关闭:', event.code, event.reason);
          if (event.code !== 1000) {
            const closeMessage = `WebSocket连接异常关闭: ${
                event.reason || '未知原因'} (代码: ${event.code})`;
            this.callbacks?.onError?.(closeMessage);
            reject(new Error(closeMessage));
          }
        };

        // 设置连接超时
        setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            const timeoutMessage = 'WebSocket连接超时';
            this.callbacks?.onError?.(timeoutMessage);
            reject(new Error(timeoutMessage));
          }
        }, 10000);  // 10秒超时

      } catch (error) {
        console.error('创建WebSocket连接失败:', error);
        reject(error);
      }
    });
  }

  // 发送初始帧
  private sendInitialFrame(): void {
    if (!this.ws || !this.config) return;

    const frame = {
      common: {app_id: this.config.appId},
      business: {
        language: 'zh_cn',
        domain: 'iat',
        accent: 'mandarin',
        vad_eos: 3000,
        dwa: 'wpgs',  // 开启动态修正
        ptt: 1,       // 开启标点符号
        rlang: 'zh-cn'
      },
      data: {status: 0, format: 'audio/L16;rate=16000', encoding: 'raw'}
    };

    this.ws.send(JSON.stringify(frame));
  }

  // 处理WebSocket消息
  private handleMessage(data: string): void {
    try {
      const result = JSON.parse(data);

      if (result.code !== 0) {
        this.callbacks?.onError?.(
            `语音识别错误: ${result.message} (${result.code})`);
        return;
      }

      if (result.data && result.data.result) {
        const text = this.extractText(result.data.result);
        const isFinal = result.data.status === 2;

        this.callbacks?.onResult?.({text, isFinal});
      }
    } catch (error) {
      console.error('解析语音识别结果失败:', error);
    }
  }

  // 从识别结果中提取文本
  private extractText(result: any): string {
    if (!result.ws || !Array.isArray(result.ws)) return '';

    let text = '';
    for (const ws of result.ws) {
      if (ws.cw && Array.isArray(ws.cw)) {
        for (const cw of ws.cw) {
          if (cw.w) {
            text += cw.w;
          }
        }
      }
    }

    return text;
  }

  // 初始化音频录制
  private async initAudioRecording(): Promise<void> {
    try {
      // 获取音频流，不指定采样率
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {channelCount: 1, echoCancellation: true, noiseSuppression: true}
      });

      // 使用默认AudioContext
      this.audioContext = new AudioContext();
      const source = this.audioContext.createMediaStreamSource(stream);

      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.processor.onaudioprocess = (event) => {
        if (this.isRecording && this.ws &&
            this.ws.readyState === WebSocket.OPEN) {
          const audioData = event.inputBuffer.getChannelData(0);

          // 总是重采样到16kHz
          const resampledData = this.resampleAudio(
              audioData, this.audioContext!.sampleRate, 16000);
          const pcmData = this.floatTo16BitPCM(resampledData);
          const base64Data =
              btoa(String.fromCharCode(...new Uint8Array(pcmData)));

          // 使用后端代理的消息格式
          const frame = {type: 'audio', status: 1, audio: base64Data};

          this.ws.send(JSON.stringify(frame));
        }
      };

    } catch (error) {
      console.error('初始化音频录制失败:', error);
      throw new Error('无法访问麦克风权限');
    }
  }

  // 音频重采样
  private resampleAudio(
      input: Float32Array, sourceRate: number,
      targetRate: number): Float32Array {
    if (sourceRate === targetRate) return input;

    const ratio = sourceRate / targetRate;
    const newLength = Math.round(input.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const index = Math.floor(i * ratio);
      result[i] = input[index];
    }

    return result;
  }

  // 浮点数转换为16位PCM
  private floatTo16BitPCM(input: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);

    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    return buffer;
  }

  // 开始语音识别
  async startRecognition(callbacks: SpeechRecognitionCallbacks): Promise<void> {
    if (this.isRecording) {
      throw new Error('语音识别正在进行中');
    }

    if (!this.config) {
      throw new Error('请先设置讯飞语音API配置');
    }

    this.callbacks = callbacks;
    this.isRecording = true;

    try {
      await this.initWebSocket();
      await this.initAudioRecording();

      this.callbacks.onStart?.();
    } catch (error) {
      this.isRecording = false;
      throw error;
    }
  }

  // 停止语音识别
  stopRecognition(): void {
    if (!this.isRecording) return;

    this.isRecording = false;

    // 发送结束帧
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const endFrame = {type: 'end'};

      this.ws.send(JSON.stringify(endFrame));
      setTimeout(() => {
        this.ws?.close(1000, '正常关闭');
      }, 100);
    }

    // 清理资源
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.callbacks?.onEnd?.();
    this.callbacks = null;
  }

  // 检查浏览器支持
  static isSupported(): boolean {
    return !!(
        navigator.mediaDevices && window.MediaRecorder && window.AudioContext);
  }

  // 检查配置是否完整
  static isConfigComplete(apiKeys: ApiKeys): boolean {
    return !!(
        apiKeys.xunfeiAppId && apiKeys.xunfeiApiKey && apiKeys.xunfeiApiSecret);
  }
}

// 导出单例实例和类
export const speechService = new SpeechRecognitionService();
export {SpeechRecognitionService};