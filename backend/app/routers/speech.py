from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from fastapi.responses import HTMLResponse
import json
import base64
import hmac
import hashlib
import time
from datetime import datetime
from urllib.parse import urlencode
import asyncio
import websockets
from app.middleware import get_current_active_user
from app.models import User
from app.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/speech", tags=["speech"])

# 讯飞语音API配置
XUNFEI_HOST = "iat-api.xfyun.cn"
XUNFEI_PATH = "/v2/iat"


class SpeechRecognitionManager:
    def __init__(self):
        self.active_connections = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        # 不再调用accept，因为已经在WebSocket端点中调用了
        self.active_connections[user_id] = websocket

    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]

    async def send_message(self, message: str, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)


manager = SpeechRecognitionManager()


def generate_auth_url(api_key: str, api_secret: str) -> str:
    """生成讯飞语音API的鉴权URL"""
    # 生成RFC1123格式的日期
    date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    request_line = f"GET {XUNFEI_PATH} HTTP/1.1"

    # 生成签名原始字符串
    signature_origin = f"host: {XUNFEI_HOST}\ndate: {date}\n{request_line}"

    # 使用HMAC-SHA256生成签名
    signature = hmac.new(
        api_secret.encode('utf-8'), signature_origin.encode('utf-8'), hashlib.sha256
    ).digest()
    signature_base64 = base64.b64encode(signature).decode('utf-8')

    # 生成authorization
    authorization_origin = f'api_key="{api_key}", algorithm="hmac-sha256", headers="host date request-line", signature="{signature_base64}"'
    authorization_base64 = base64.b64encode(
        authorization_origin.encode('utf-8')
    ).decode('utf-8')

    # 构建URL参数
    params = {"host": XUNFEI_HOST, "date": date, "authorization": authorization_base64}

    return f"wss://{XUNFEI_HOST}{XUNFEI_PATH}?{urlencode(params)}"


async def forward_to_xunfei(
    websocket: WebSocket, api_key: str, api_secret: str, app_id: str
):
    """转发WebSocket消息到讯飞API"""
    try:
        # 生成鉴权URL
        auth_url = generate_auth_url(api_key, api_secret)
        print(f"连接到讯飞API: {auth_url}")

        async with websockets.connect(auth_url) as xunfei_ws:
            # 发送初始帧
            initial_frame = {
                "common": {"app_id": app_id},
                "business": {
                    "language": "zh_cn",
                    "domain": "iat",
                    "accent": "mandarin",
                    "vad_eos": 3000,
                    "dwa": "wpgs",
                    "ptt": 1,
                    "rlang": "zh-cn",
                },
                "data": {
                    "status": 0,
                    "format": "audio/L16;rate=16000",
                    "encoding": "raw",
                },
            }
            await xunfei_ws.send(json.dumps(initial_frame))

            # 处理双向消息转发
            async def receive_from_client():
                try:
                    while True:
                        data = await websocket.receive_text()
                        message = json.loads(data)

                        if message.get("type") == "audio":
                            # 转发音频数据到讯飞
                            audio_frame = {
                                "data": {
                                    "status": message.get("status", 1),
                                    "format": "audio/L16;rate=16000",
                                    "encoding": "raw",
                                    "audio": message["audio"],
                                }
                            }
                            await xunfei_ws.send(json.dumps(audio_frame))
                        elif message.get("type") == "end":
                            # 发送结束帧
                            end_frame = {
                                "data": {
                                    "status": 2,
                                    "format": "audio/L16;rate=16000",
                                    "encoding": "raw",
                                    "audio": "",
                                }
                            }
                            await xunfei_ws.send(json.dumps(end_frame))

                except WebSocketDisconnect:
                    print("客户端断开连接")

            async def receive_from_xunfei():
                try:
                    while True:
                        data = await xunfei_ws.recv()
                        # 转发讯飞响应到客户端
                        await websocket.send_text(data)
                except websockets.exceptions.ConnectionClosed:
                    print("讯飞API连接关闭")

            # 同时处理两个方向的通信
            await asyncio.gather(receive_from_client(), receive_from_xunfei())

    except Exception as e:
        print(f"讯飞API连接错误: {e}")
        try:
            # 只在连接仍然打开时发送错误消息
            if websocket.client_state.name == "CONNECTED":
                await websocket.send_text(
                    json.dumps({"code": 1006, "message": f"讯飞API连接失败: {str(e)}"})
                )
        except Exception:
            # 如果发送失败，忽略错误
            pass


@router.websocket("/recognize")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    """语音识别WebSocket端点"""
    try:
        # 首先接受WebSocket连接
        await websocket.accept()
        print("WebSocket连接已接受")

        # 等待客户端发送认证信息
        auth_data = await websocket.receive_text()
        auth_info = json.loads(auth_data)

        # 这里应该验证用户身份，暂时简化处理
        user_id = auth_info.get("user_id")
        api_keys = auth_info.get("api_keys", {})

        app_id = api_keys.get("xunfei_app_id")
        api_key = api_keys.get("xunfei_api_key")
        api_secret = api_keys.get("xunfei_api_secret")

        if not all([app_id, api_key, api_secret]):
            await websocket.send_text(
                json.dumps({"code": 401, "message": "缺少讯飞语音API配置"})
            )
            await websocket.close()
            return

        # 连接到管理器
        await manager.connect(websocket, user_id)

        try:
            # 开始转发到讯飞API
            await forward_to_xunfei(websocket, api_key, api_secret, app_id)
        except WebSocketDisconnect:
            manager.disconnect(user_id)
        except Exception as e:
            print(f"语音识别错误: {e}")
            try:
                # 只在连接仍然打开时发送错误消息
                if websocket.client_state.name == "CONNECTED":
                    await websocket.send_text(
                        json.dumps({"code": 500, "message": f"语音识别错误: {str(e)}"})
                    )
            except Exception:
                # 如果发送失败，忽略错误
                pass

    except Exception as e:
        print(f"WebSocket连接错误: {e}")
        try:
            # 只在连接仍然打开时关闭连接
            if websocket.client_state.name == "CONNECTED":
                await websocket.close()
        except Exception:
            # 如果关闭失败，忽略错误
            pass


@router.get("/test")
async def test_speech():
    """测试语音识别服务"""
    return {"message": "语音识别服务运行正常"}


# 将路由添加到主应用
def include_speech_router(app):
    app.include_router(router)
