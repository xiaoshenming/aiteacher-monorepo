#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FunASR微服务 - 基于FastAPI的语音识别服务
支持录音后高精度转写和实时流式转写

模型:
  - FunAudioLLM/Fun-ASR-Nano-2512: 录音后高精度转写
  - iic/SenseVoiceSmall: 实时流式同传（低延迟、多语言、情感识别）
"""

import os
from pathlib import Path

# 设置ModelScope缓存目录到本地 ./models 文件夹
# 必须在导入 funasr 之前设置
os.environ['MODELSCOPE_CACHE'] = str(Path(__file__).parent / "models")

from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from funasr import AutoModel
import soundfile as sf
import io
import json
import logging
import traceback
from typing import Optional, Dict, Any
import numpy as np
from pathlib import Path
import asyncio
from starlette.concurrency import run_in_threadpool
import time
import httpx
from dotenv import load_dotenv

# 加载 .env 文件
env_path = Path(__file__).parent / ".env"
if env_path.exists():
    load_dotenv(env_path)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理 - 启动加载模型，关闭时优雅退出"""
    # === Startup ===
    logger.info("=" * 50)
    logger.info("🚀 FunASR多模型服务启动中...")
    logger.info("=" * 50)

    try:
        load_nano_model()
    except Exception as e:
        logger.error(f"Nano模型加载失败，但服务继续: {e}")

    try:
        load_sensevoice_model()
    except Exception as e:
        logger.error(f"SenseVoiceSmall模型加载失败，但服务继续: {e}")

    logger.info("=" * 50)
    logger.info("✅ FunASR多模型服务已就绪！")
    logger.info("   📌 /transcribe - 使用Nano模型高精度转写")
    logger.info("   📌 /transcribe/sensevoice - 使用SenseVoice转写")
    logger.info("   📌 /stream - WebSocket实时流式(Nano)")
    logger.info("   📌 /stream/sensevoice - WebSocket实时流式(SenseVoice)")
    logger.info("=" * 50)

    yield

    # === Shutdown ===
    logger.info("🛑 FunASR服务正在关闭...")
    logger.info("✅ FunASR服务已优雅关闭")


# 创建FastAPI应用
app = FastAPI(
    title="FunASR语音识别服务",
    description="多模型语音识别服务：Fun-ASR-Nano-2512(高精度) + SenseVoiceSmall(实时流式)",
    version="2.0.0",
    lifespan=lifespan,
)

# 配置CORS - 允许Node.js后端调用
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# 模型配置
# ========================================

# 模型1: Fun-ASR-Nano-2512 (高精度离线转写)
nano_model: Optional[AutoModel] = None
NANO_MODEL_NAME = "FunAudioLLM/Fun-ASR-Nano-2512"

# 模型2: SenseVoiceSmall (实时流式同传)
sensevoice_model: Optional[AutoModel] = None
SENSEVOICE_MODEL_NAME = "iic/SenseVoiceSmall"

# 保持向后兼容的别名
model: Optional[AutoModel] = None
MODEL_NAME = NANO_MODEL_NAME


def load_nano_model():
    """加载Fun-ASR-Nano-2512模型（高精度离线转写）"""
    global nano_model, model
    if nano_model is None:
        try:
            logger.info(f"🔄 正在加载模型: {NANO_MODEL_NAME}")
            nano_model = AutoModel(
                model=NANO_MODEL_NAME,
                vad_model="fsmn-vad",  # 语音活动检测
                punc_model="ct-punc",  # 标点恢复
                device="cpu",  # GPU改为"cuda:0"
                disable_update=True  # 禁用自动更新
            )
            model = nano_model  # 向后兼容
            logger.info(f"✅ {NANO_MODEL_NAME} 模型加载成功！")
        except Exception as e:
            logger.error(f"❌ {NANO_MODEL_NAME} 模型加载失败: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    return nano_model


def load_sensevoice_model():
    """加载SenseVoiceSmall模型（实时流式同传）"""
    global sensevoice_model
    if sensevoice_model is None:
        try:
            logger.info(f"🔄 正在加载模型: {SENSEVOICE_MODEL_NAME}")
            sensevoice_model = AutoModel(
                model=SENSEVOICE_MODEL_NAME,
                vad_model="fsmn-vad",  # 语音活动检测
                vad_kwargs={"max_single_segment_time": 30000},  # 最大单段30秒
                device="cpu",  # GPU改为"cuda:0"
                disable_update=True  # 禁用自动更新
            )
            logger.info(f"✅ {SENSEVOICE_MODEL_NAME} 模型加载成功！")
            logger.info("   💡 SenseVoiceSmall特性: 低延迟、多语言(中/英/日/韩/粤)、情感识别")
        except Exception as e:
            logger.error(f"❌ {SENSEVOICE_MODEL_NAME} 模型加载失败: {str(e)}")
            logger.error(traceback.format_exc())
            raise
    return sensevoice_model


def load_model():
    """加载FunASR模型（向后兼容）"""
    return load_nano_model()


@app.get("/")
async def root():
    """根路径 - 服务信息"""
    return {
        "service": "FunASR多模型语音识别服务",
        "version": "2.0.0",
        "status": "running",
        "models": {
            "nano": {
                "name": NANO_MODEL_NAME,
                "description": "高精度离线转写，支持VAD和标点恢复",
                "loaded": nano_model is not None
            },
            "sensevoice": {
                "name": SENSEVOICE_MODEL_NAME,
                "description": "实时流式同传，低延迟，支持多语言和情感识别",
                "loaded": sensevoice_model is not None
            }
        },
        "endpoints": {
            "health": "GET /health - 健康检查",
            "transcribe": "POST /transcribe - 录音后转写(Nano模型)",
            "transcribe_sensevoice": "POST /transcribe/sensevoice - 录音后转写(SenseVoice)",
            "stream": "WebSocket /stream - 实时流式转写(Nano)",
            "stream_sensevoice": "WebSocket /stream/sensevoice - 实时流式同传(SenseVoice)⭐推荐"
        }
    }


@app.get("/health")
async def health_check():
    """健康检查接口"""
    nano_status = "ok" if nano_model is not None else "not_loaded"
    sensevoice_status = "ok" if sensevoice_model is not None else "not_loaded"
    
    return {
        "status": "ok" if (nano_model or sensevoice_model) else "error",
        "models": {
            "nano": {
                "name": NANO_MODEL_NAME,
                "status": nano_status
            },
            "sensevoice": {
                "name": SENSEVOICE_MODEL_NAME,
                "status": sensevoice_status
            }
        },
        "device": "cpu",
        "message": "FunASR多模型服务运行正常"
    }


def process_audio_data(audio_bytes: bytes) -> tuple:
    """
    处理音频数据
    
    Args:
        audio_bytes: 音频文件字节流
        
    Returns:
        (audio_array, sample_rate): 音频数组和采样率
    """
    try:
        # 尝试使用soundfile读取音频（带格式头的文件）
        audio, sr = sf.read(io.BytesIO(audio_bytes))
        
        # 转为单声道（如果是多声道）
        if len(audio.shape) > 1:
            logger.info(f"音频为多声道({audio.shape[1]}声道)，转换为单声道")
            audio = audio[:, 0]
        
        # 确保采样率为16kHz（FunASR标准）
        if sr != 16000:
            logger.warning(f"音频采样率为{sr}Hz，建议使用16000Hz以获得最佳效果")
        
        return audio, sr
        
    except Exception as e:
        # 如果读取失败，尝试作为 Raw PCM (16k, 16bit, mono) 处理
        # 这是 WebSocket 实时流发送的常见格式
        try:
            # logger.info("尝试作为 Raw PCM (16k, 16bit, mono) 读取")
            audio = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
            sr = 16000
            return audio, sr
        except Exception as e2:
            logger.error(f"音频数据处理失败: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=400, detail=f"音频处理失败: {str(e)}")


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    """
    录音后高精度转写接口 (使用Nano模型)
    
    Args:
        file: 上传的音频文件（支持wav, flac, mp3, m4a等格式）
        
    Returns:
        {
            "text": "完整转录文本",
            "segments": [{"start": 0.0, "end": 5.0, "text": "xxx"}],
            "duration": 音频时长(秒),
            "language": "语言代码"
        }
    """
    try:
        logger.info(f"收到转写请求(Nano): 文件={file.filename}, 类型={file.content_type}")
        
        # 读取音频文件
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="上传的音频文件为空")
        
        logger.info(f"音频文件大小: {len(audio_bytes) / 1024:.2f} KB")
        
        # 处理音频
        audio, sr = process_audio_data(audio_bytes)
        
        # 加载模型
        model_instance = load_nano_model()
        
        # 执行转写
        logger.info("开始转写(Nano模型)...")
        # 强制设置 batch_size_s 为 0 以确保 batch_size 为 1 (Nano 模型不支持批处理解码)
        result = model_instance.generate(
            input=audio,
            batch_size_s=0, 
            hotword='',  # 热词（可选）
        )
        
        # 提取结果
        if result and len(result) > 0:
            text = result[0].get("text", "")
            
            # 尝试提取分段信息（如果模型支持）
            segments = []
            if "timestamp" in result[0]:
                timestamp = result[0]["timestamp"]
                if isinstance(timestamp, list):
                    for seg in timestamp:
                        if isinstance(seg, (list, tuple)) and len(seg) >= 3:
                            segments.append({
                                "start": float(seg[0]) / 1000,  # 毫秒转秒
                                "end": float(seg[1]) / 1000,
                                "text": seg[2]
                            })
            
            # 如果没有分段信息，将整个文本作为一段
            if not segments and text:
                segments = [{
                    "start": 0.0,
                    "end": len(audio) / sr,
                    "text": text
                }]
            
            logger.info(f"转写成功(Nano): 文本长度={len(text)}, 分段数={len(segments)}")
            
            return {
                "success": True,
                "text": text,
                "segments": segments,
                "duration": len(audio) / sr,
                "language": "zh-CN",
                "model": NANO_MODEL_NAME
            }
        else:
            logger.warning("转写结果为空")
            return {
                "success": False,
                "text": "",
                "segments": [],
                "duration": len(audio) / sr,
                "error": "转写结果为空"
            }
            
    except Exception as e:
        logger.error(f"转写失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"转写失败: {str(e)}")


@app.post("/transcribe/sensevoice")
async def transcribe_sensevoice(
    file: UploadFile = File(...),
    language: str = Query("auto", description="语言代码: auto/zh/en/ja/ko/yue")
):
    """
    SenseVoiceSmall转写接口 (支持多语言、情感识别)
    
    特点:
        - 支持语言: 中文(zh)、英文(en)、日语(ja)、韩语(ko)、粤语(yue)、自动(auto)
        - 情感识别: 可识别语音中的情感信息
        - 低延迟: 适合实时场景
    
    Args:
        file: 上传的音频文件
        language: 语言代码 (auto/zh/en/ja/ko/yue)
        
    Returns:
        {
            "text": "转录文本",
            "language": "检测到的语言",
            "emotion": "情感信息(如果有)",
            "duration": 音频时长(秒)
        }
    """
    try:
        logger.info(f"收到转写请求(SenseVoice): 文件={file.filename}, 语言={language}")
        
        # 读取音频文件
        audio_bytes = await file.read()
        if len(audio_bytes) == 0:
            raise HTTPException(status_code=400, detail="上传的音频文件为空")
        
        logger.info(f"音频文件大小: {len(audio_bytes) / 1024:.2f} KB")
        
        # 处理音频
        audio, sr = process_audio_data(audio_bytes)
        
        # 加载SenseVoice模型
        model_instance = load_sensevoice_model()
        
        # 执行转写
        logger.info("开始转写(SenseVoice模型)...")
        result = model_instance.generate(
            input=audio,
            cache={},
            language=language,  # 支持多语言
            use_itn=True,  # 使用逆文本正则化
            batch_size_s=60,  # SenseVoice支持更大batch
        )
        
        # 提取结果
        if result and len(result) > 0:
            raw_text = result[0].get("text", "")
            
            # SenseVoice可能返回带情感标签的文本，如 "<|zh|><|NEUTRAL|><|Speech|>你好"
            # 解析这些标签
            text = raw_text
            detected_lang = language
            emotion = None
            
            # 解析语言标签
            if "<|zh|>" in raw_text:
                detected_lang = "zh"
            elif "<|en|>" in raw_text:
                detected_lang = "en"
            elif "<|ja|>" in raw_text:
                detected_lang = "ja"
            elif "<|ko|>" in raw_text:
                detected_lang = "ko"
            elif "<|yue|>" in raw_text:
                detected_lang = "yue"
            
            # 解析情感标签
            emotions = ["HAPPY", "SAD", "ANGRY", "NEUTRAL", "FEARFUL", "DISGUSTED", "SURPRISED"]
            for emo in emotions:
                if f"<|{emo}|>" in raw_text:
                    emotion = emo.lower()
                    break
            
            # 清理标签，只保留纯文本
            import re
            text = re.sub(r'<\|[^|]+\|>', '', raw_text).strip()
            
            logger.info(f"转写成功(SenseVoice): 文本长度={len(text)}, 语言={detected_lang}, 情感={emotion}")
            
            return {
                "success": True,
                "text": text,
                "raw_text": raw_text,  # 保留原始带标签的文本
                "language": detected_lang,
                "emotion": emotion,
                "duration": len(audio) / sr,
                "model": SENSEVOICE_MODEL_NAME
            }
        else:
            logger.warning("转写结果为空")
            return {
                "success": False,
                "text": "",
                "duration": len(audio) / sr,
                "error": "转写结果为空"
            }
            
    except Exception as e:
        logger.error(f"SenseVoice转写失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"转写失败: {str(e)}")


@app.websocket("/stream")
async def websocket_stream(websocket: WebSocket):
    """
    实时流式转写接口 (Nano模型)
    
    协议:
        客户端发送: 二进制音频数据块 或 {"type": "end"} 结束标记
        服务端返回: {"text": "实时识别文本", "is_final": false/true}
    """
    await websocket.accept()
    logger.info("WebSocket连接已建立(Nano模型)")
    
    # 音频缓存
    audio_cache = []
    total_text = ""
    
    try:
        # 加载模型
        model_instance = load_nano_model()
        
        while True:
            try:
                # 接收数据
                data = await websocket.receive()
                
                # 处理文本消息（控制命令）
                if "text" in data:
                    message = json.loads(data["text"])
                    
                    if message.get("type") == "end":
                        logger.info("收到结束标记，关闭连接")
                        await websocket.send_json({
                            "text": total_text,
                            "is_final": True,
                            "message": "转写完成"
                        })
                        break
                
                # 处理二进制音频数据
                elif "bytes" in data:
                    audio_bytes = data["bytes"]
                    logger.info(f"收到音频数据: {len(audio_bytes)} 字节")
                    
                    # 缓存音频数据
                    audio_cache.append(audio_bytes)
                    
                    # 当缓存达到一定大小时进行识别（例如：1秒的音频数据）
                    # 假设16kHz采样率，16位深度，单声道：1秒 = 32000字节
                    total_bytes = sum(len(chunk) for chunk in audio_cache)
                    
                    if total_bytes >= 32000:  # 约1秒音频
                        # 合并音频数据
                        combined_audio = b''.join(audio_cache)
                        
                        try:
                            # 处理音频
                            audio, sr = process_audio_data(combined_audio)
                            
                            # 执行识别
                            result = model_instance.generate(
                                input=audio,
                                batch_size_s=0
                            )
                            
                            if result and len(result) > 0:
                                text = result[0].get("text", "")
                                if text:
                                    total_text += text
                                    logger.info(f"实时识别: {text}")
                                    
                                    # 发送识别结果
                                    await websocket.send_json({
                                        "text": text,
                                        "is_final": False,
                                        "total_text": total_text
                                    })
                            
                            # 清空缓存
                            audio_cache.clear()
                            
                        except Exception as e:
                            logger.error(f"流式识别出错: {str(e)}")
                            await websocket.send_json({
                                "error": str(e),
                                "is_final": False
                            })
                            audio_cache.clear()
                
            except WebSocketDisconnect:
                logger.info("客户端断开连接")
                break
                
    except Exception as e:
        logger.error(f"WebSocket处理异常: {str(e)}")
        logger.error(traceback.format_exc())
        try:
            await websocket.send_json({
                "error": str(e),
                "is_final": True
            })
        except:
            pass
    
    finally:
        try:
            await websocket.close()
            logger.info("WebSocket连接已关闭")
        except:
            pass


@app.websocket("/stream/sensevoice")
async def websocket_stream_sensevoice(websocket: WebSocket):
    """
    SenseVoiceSmall实时流式同传接口 ⭐推荐用于实时同传
    
    策略:
        - 累积识别: 持续缓存用户的音频并不断进行全量识别，实现"字一个个蹦出来"的效果
        - 静音检测: 检测到停顿时自动断句，清空缓存，开始下一句
    """
    await websocket.accept()
    logger.info("🎙️ WebSocket连接已建立(SenseVoice实时同传)")
    
    # === 状态变量 ===
    # 当前句子的音频缓存 (list of bytes)
    sentence_buffer = []
    # 累积的完整文本 (已提交的历史记录)
    committed_text = ""
    # 静音检测相关
    silence_threshold = 0.01  # 静音阈值 (0-1), 根据实际麦克风底噪调整
    silence_duration = 0.0    # 当前持续静音时长 (秒)
    max_silence_duration = 0.8 # 超过0.8秒静音则断句
    min_sentence_duration = 0.5 # 句子最短时长，避免太短的噪音触发识别
    
    # 动态断句状态
    current_sentence_duration = 0.0
    
    language = "auto"
    mode = "normal"
    # SenseVoice 不需要 cache_for_model (它是非流式模型)
    
    import time
    last_inference_time = 0.0
    inference_interval = 0.1 # 默认直接使用极速模式(0.1s)，以提供最佳实时体验
    
    try:
        # 加载SenseVoice模型
        model_instance = load_sensevoice_model()
        
        while True:
            try:
                # 接收数据
                data = await websocket.receive()
                
                # 处理文本消息（控制命令）
                if "text" in data:
                    message = json.loads(data["text"])
                    if message.get("type") == "end":
                        # ... (原有结束逻辑)
                        await websocket.send_json({
                            "text": "",
                            "is_final": True, # 触发前端提交
                            "message": "Session ended"
                        })
                        break
                    elif message.get("type") == "config":
                        language = message.get("language", "auto")
                
                # 处理二进制音频数据
                elif "bytes" in data:
                    audio_chunk_bytes = data["bytes"]
                    sentence_buffer.append(audio_chunk_bytes)
                    
                    # 1. 检测当前 chunk 是否为静音
                    # 先转为 numpy array 计算能量
                    try:
                        chunk_np = np.frombuffer(audio_chunk_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                        chunk_rms = np.sqrt(np.mean(chunk_np**2))
                        chunk_duration = len(chunk_np) / 16000.0
                        
                        if chunk_rms < silence_threshold:
                            silence_duration += chunk_duration
                        else:
                            silence_duration = 0.0
                    except:
                        pass

                    # 更新总时长
                    current_sentence_duration += chunk_duration
                    
                    # 动态调整静音阈值和断句策略
                    # 如果句子变长，必须更积极地断句以防止延迟累积
                    
                    dynamic_max_silence = max_silence_duration
                    if current_sentence_duration > 5.0:
                        dynamic_max_silence = 0.4 # 5秒以上，中等敏感
                    if current_sentence_duration > 8.0:
                        dynamic_max_silence = 0.1 # 8秒以上，极其敏感

                    # 2. 判断是否满足识别条件
                    # 策略优化：
                    
                    is_silence_trigger = (silence_duration > dynamic_max_silence)
                    is_forced_cut = (current_sentence_duration > 15.0) # 降至15秒强制截断(避免长难句卡死)
                    
                    current_time = time.time()
                    
                    # 如果不是静音触发，且距离上次识别不足 0.2s，且 buffer 数据不是特别少（刚开始）
                    # 则跳过本次识别，防止 CPU 跑满导致队列积压，产生延迟
                    if not is_silence_trigger and not is_forced_cut and (current_time - last_inference_time < inference_interval):
                         # 除非 buffer 刚开始积累（比如前几个包），可以为了快速响应而跑
                         # 但通常累积一点再跑更稳
                         if len(sentence_buffer) * (len(audio_chunk_bytes)/16000/2) > 1.0: # 稍微放宽
                             continue
                         # 或者简单的：严格限频
                         if len(sentence_buffer) > 2: # 忽略极短的初始包
                             continue

                    last_inference_time = current_time

                    # 3. 拼接当前句子的所有音频
                    combined_audio_bytes = b''.join(sentence_buffer)
                    # 注意：这里不需要每次都 process_audio_data (sf.read 比较慢且对无头PCM不友好)
                    # 直接用 numpy 加载即可，因为我们已经知道格式
                    
                    try:
                        audio = np.frombuffer(combined_audio_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                    except:
                         continue

                    # 4. 执行识别 (SenseVoice 推理很快，但CPU计算会阻塞EventLoop，必须用线程池)
                    try:
                        # 构造推理函数
                        def run_inference():
                            return model_instance.generate(
                                input=audio,
                                cache={}, 
                                language=language,
                                use_itn=False, 
                                batch_size_s=60
                            )
                        
                        # 在线程池中运行，避免阻塞 WebSocket 接收
                        result = await run_in_threadpool(run_inference)
                        
                        if result and len(result) > 0:
                            raw_text = result[0].get("text", "")
                            # 清理标签
                            import re
                            text = re.sub(r'<\|[^|]+\|>', '', raw_text).strip()
                            
                            # 获取情感
                            emotion = "neutral"
                            emotions = ["HAPPY", "SAD", "ANGRY", "NEUTRAL", "FEARFUL", "DISGUSTED", "SURPRISED"]
                            for emo in emotions:
                                if f"<|{emo}|>" in raw_text:
                                    emotion = emo.lower()
                                    break

                            # 只要有文本（或者是空文本但是静音），都推送到前端？
                            # 不，只推有内容的。但是注意 SenseVoice 在没说完时可能输出不完整。
                            # 关键：不要在这里清空 buffer！ 只有 silence 触发时才清空！
                            
                            if text:
                                # 发送实时结果 (is_final=False)
                                # 注意：这里的 total_text 是 "已提交的历史" + "当前正在变的句子"
                                await websocket.send_json({
                                    "text": text, # 当前句子的文本
                                    "emotion": emotion,
                                    "is_final": False,
                                    "total_text": committed_text + text # 全量文本
                                })
                                
                                # 5. 自动断句逻辑 (优化版)
                                # 触发条件：
                                # A. 静音超时 (is_silence_trigger)
                                # B. 强制时长熔断 (is_forced_cut)
                                # C. 标点符号断句：如果文本以标点结尾(含逗号)，且句子长度适中(>2s)，也可以提前断句，防止 buffer 过长
                                
                                # 将逗号也纳入断句符号 (解决长难句不断句的问题)
                                is_punctuation_end = text.endswith(('。', '？', '！', '.', '?', '!', '，', ','))
                                is_long_stable = (current_sentence_duration > 2.0) and is_punctuation_end
                                
                                if is_silence_trigger or is_forced_cut or is_long_stable:
                                    # 假如是标点断句，记录一下
                                    cut_reason = "Silence"
                                    if is_forced_cut: cut_reason = "Force"
                                    elif is_long_stable: cut_reason = "Punctuation"
                                    
                                    logger.info(f"✂️ 自动断句 ({cut_reason}): {text}")
                                    
                                    # 发送 final 信号让前端由"变"转"定"
                                    # 前端逻辑：is_final=True 时，将 text 加入历史记录
                                    await websocket.send_json({
                                        "text": text,
                                        "emotion": emotion,
                                        "is_final": True,
                                        "total_text": committed_text + text
                                    })
                                    
                                    # 更新状态
                                    committed_text += text
                                    sentence_buffer = [] # 清空 buffer，开始新句子
                                    silence_duration = 0.0
                                    current_sentence_duration = 0.0

                    except Exception as e:
                        logger.error(f"Inference error: {e}")

            except WebSocketDisconnect:
                logger.info("客户端断开连接")
                break
                
    except Exception as e:
        logger.error(f"WebSocket处理异常: {str(e)}")
        try:
            await websocket.send_json({"error": str(e), "is_final": True})
        except:
            pass
    finally:
        try:
            await websocket.close()
        except:
            pass


@app.post("/batch-transcribe")
async def batch_transcribe(files: list[UploadFile] = File(...)):
    """
    批量转写接口
    
    Args:
        files: 多个音频文件
        
    Returns:
        [
            {"filename": "xxx", "text": "xxx", "success": true},
            ...
        ]
    """
    results = []
    
    for file in files:
        try:
            logger.info(f"批量转写: 处理文件 {file.filename}")
            
            # 读取音频
            audio_bytes = await file.read()
            audio, sr = process_audio_data(audio_bytes)
            
            # 转写
            model_instance = load_model()
            result = model_instance.generate(input=audio, batch_size_s=0)
            
            text = result[0].get("text", "") if result and len(result) > 0 else ""
            
            results.append({
                "filename": file.filename,
                "text": text,
                "duration": len(audio) / sr,
                "success": True
            })
            
        except Exception as e:
            logger.error(f"处理文件 {file.filename} 失败: {str(e)}")
            results.append({
                "filename": file.filename,
                "error": str(e),
                "success": False
            })
    
    return {
        "total": len(files),
        "success_count": sum(1 for r in results if r["success"]),
        "results": results
    }


# ========================================
# Qwen 纠错客户端
# ========================================
class QwenCorrector:
    """Qwen 文本纠错客户端 - 修正语音识别错误"""

    def __init__(self, api_key: str, model: str = "qwen-plus"):
        self.api_key = api_key
        self.model = model
        self.client: Optional[httpx.AsyncClient] = None
        self.base_url = "https://dashscope.aliyuncs.com"
        self.api_path = "/compatible-mode/v1/chat/completions"

    async def init(self):
        """初始化 HTTP 客户端"""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=10.0
        )

    async def correct(self, text: str, context: str = "") -> Optional[str]:
        """
        纠正语音识别错误

        Args:
            text: 需要纠错的文本
            context: 上下文信息（前文）
        """
        if not text or not self.client:
            return None

        # 构建纠错 prompt
        if context:
            prompt = f"""你是一个语音识别结果纠错专家。请修正以下语音识别文本中的错误。

上下文（前文）：{context}

当前识别文本：{text}

要求：
1. 修正明显的语音识别错误（如同音字、漏字、错字）
2. 保持原文的语义和语气
3. 特别注意人名、地名、文学作品的准确性
4. 只输出修正后的文本，不要解释

修正后的文本："""
        else:
            prompt = f"""你是一个语音识别结果纠错专家。请修正以下语音识别文本中的错误。

识别文本：{text}

要求：
1. 修正明显的语音识别错误（如同音字、漏字、错字）
2. 保持原文的语义和语气
3. 特别注意人名、地名、文学作品的准确性
4. 只输出修正后的文本，不要解释

修正后的文本："""

        try:
            payload = {
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.1,
                "max_tokens": 200
            }

            response = await self.client.post(self.api_path, json=payload)
            response.raise_for_status()

            result = response.json()
            corrected = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            return corrected.strip() if corrected else None

        except Exception as e:
            logger.error(f"纠错失败: {e}")
            return None

    async def close(self):
        """关闭客户端"""
        if self.client:
            await self.client.aclose()


# ========================================
# Qwen 翻译客户端
# ========================================
class QwenTranslator:
    """Qwen 翻译客户端"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client: Optional[httpx.AsyncClient] = None
        self.base_url = "https://dashscope.aliyuncs.com"
        self.api_path = "/compatible-mode/v1/chat/completions"

    async def init(self):
        """初始化 HTTP 客户端"""
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=30.0
        )

    async def translate(self, text: str, mode: str = "zh2en") -> Optional[str]:
        """
        翻译文本

        Args:
            text: 需要翻译的文本
            mode: 翻译模式，格式为 "{src}2{tgt}"，如 zh2en, en2zh, zh2ja 等
        """
        if not text or not self.client:
            return None

        try:
            # 语言代码到名称的映射
            lang_names = {
                "zh": "Chinese",
                "en": "English",
                "ja": "Japanese",
                "ko": "Korean",
                "fr": "French",
                "de": "German",
                "es": "Spanish",
            }

            # 解析翻译模式
            parts = mode.split("2", 1)
            if len(parts) != 2:
                return None
            src_code, tgt_code = parts
            source_lang = lang_names.get(src_code)
            target_lang = lang_names.get(tgt_code)
            if not source_lang or not target_lang or src_code == tgt_code:
                return None

            payload = {
                "model": "qwen-plus",
                "messages": [
                    {"role": "system", "content": f"You are a translator. Translate the following text from {source_lang} to {target_lang}. Only output the translation, nothing else."},
                    {"role": "user", "content": text}
                ],
                "temperature": 0.3,
                "max_tokens": 500
            }

            response = await self.client.post(self.api_path, json=payload)
            response.raise_for_status()

            result = response.json()
            translated = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            return translated.strip() if translated else None

        except Exception as e:
            logger.error(f"翻译失败: {e}")
            return None

    async def close(self):
        """关闭客户端"""
        if self.client:
            await self.client.aclose()


# ========================================
# 翻译 WebSocket 端点
# ========================================
@app.websocket("/stream/sensevoice/translation")
async def websocket_stream_translation(websocket: WebSocket):
    """
    SenseVoice 实时语音翻译端点

    功能：语音识别 + 智能纠错 + 实时翻译

    协议:
        客户端发送:
            - 配置: {"type": "config", "language": "zh", "mode": "zh2en", "enable_correction": true}
            - 音频: 二进制 PCM 数据
            - 结束: {"type": "end"}

        服务端返回:
            {
                "type": "result",
                "original": "原始识别文本",
                "corrected": "纠错后文本",
                "translation": "翻译结果",
                "is_final": true,
                "cut_reason": "punctuation"
            }
    """
    await websocket.accept()
    logger.info("🎙️ 翻译 WebSocket 连接已建立")

    # 音频缓存（与 test_svs_fy.py 保持一致）
    sentence_buffer = []
    committed_text = ""
    silence_duration = 0.0
    sentence_time = 0.0

    # 配置（默认值）
    language = "zh"
    translation_mode = "zh2en"  # zh2en 或 en2zh
    enable_correction = True  # 默认启用纠错

    # 断句配置（与 test_svs_fy.py 完全一致）
    SILENCE_THRESHOLD = 0.01
    MAX_SILENCE_DURATION = 0.7
    MIN_SENTENCE_DURATION = 0.5
    MAX_SENTENCE_DURATION = 12.0
    INFERENCE_INTERVAL = 0.1

    # 翻译器和纠错器
    translator = None
    corrector = None
    api_key = os.getenv("DASHSCOPE_API_KEY", "")

    # 关闭标志
    is_closing = False

    # 上下文记忆（用于纠错）
    context_memory = []

    try:
        # 加载模型
        model_instance = load_sensevoice_model()

        # 初始化翻译器
        if api_key:
            translator = QwenTranslator(api_key)
            await translator.init()
            logger.info(f"✅ 翻译服务已启动 (模式: {translation_mode})")
        else:
            logger.warning("⚠️  未配置 DASHSCOPE_API_KEY，翻译功能不可用")

        # 初始化纠错器
        if api_key and enable_correction:
            corrector = QwenCorrector(api_key, "qwen-plus")
            await corrector.init()
            logger.info("✅ 纠错服务已启动 (qwen-plus)")

        last_inference_time = 0.0

        while not is_closing:
            try:
                # 接收数据，设置超时避免卡死
                data = await asyncio.wait_for(websocket.receive(), timeout=1.0)

                # 处理文本消息（控制命令）
                if "text" in data:
                    message = json.loads(data["text"])

                    if message.get("type") == "end":
                        is_closing = True
                        await websocket.send_json({
                            "type": "result",
                            "text": "",
                            "is_final": True,
                            "message": "Session ended"
                        })
                        break

                    elif message.get("type") == "config":
                        new_language = message.get("language", "zh")
                        new_mode = message.get("mode", "zh2en")
                        new_correction = message.get("enable_correction", True)

                        # 检测是否需要重新初始化纠错器
                        if new_correction != enable_correction:
                            enable_correction = new_correction
                            if enable_correction and api_key and not corrector:
                                corrector = QwenCorrector(api_key, "qwen-plus")
                                await corrector.init()
                                logger.info("✅ 纠错服务已启用")
                            elif not enable_correction and corrector:
                                await corrector.close()
                                corrector = None
                                logger.info("❌ 纠错服务已禁用")

                        language = new_language
                        translation_mode = new_mode
                        logger.info(f"⚙️  配置更新: language={language}, mode={translation_mode}, correction={enable_correction}")

                # 处理二进制音频数据
                elif "bytes" in data:
                    audio_chunk_bytes = data["bytes"]
                    sentence_buffer.append(audio_chunk_bytes)

                    # 1. 检测当前 chunk 是否为静音
                    try:
                        chunk_np = np.frombuffer(audio_chunk_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                        chunk_duration = len(chunk_np) / 16000.0

                        # 计算能量
                        chunk_rms = np.sqrt(np.mean(chunk_np**2))
                        is_speech = chunk_rms > SILENCE_THRESHOLD

                        if not is_speech:
                            silence_duration += chunk_duration
                        else:
                            silence_duration = 0.0

                        sentence_time += chunk_duration

                    except:
                        pass

                    # 2. 动态调整断句策略（与 test_svs_fy.py 完全一致）
                    dynamic_silence = MAX_SILENCE_DURATION
                    if sentence_time > 5.0:
                        dynamic_silence = 0.5
                    elif sentence_time > 8.0:
                        dynamic_silence = 0.3

                    # 3. 判断是否需要识别
                    current_time = time.time()
                    time_since_last = current_time - last_inference_time if last_inference_time else INFERENCE_INTERVAL

                    is_silence_trigger = silence_duration > dynamic_silence
                    is_forced_cut = sentence_time >= MAX_SENTENCE_DURATION

                    should_recognize = (
                        is_silence_trigger or
                        is_forced_cut or
                        time_since_last >= INFERENCE_INTERVAL
                    )

                    if not should_recognize:
                        continue

                    last_inference_time = current_time

                    # 4. 执行识别
                    combined_audio = b''.join(sentence_buffer)

                    try:
                        audio = np.frombuffer(combined_audio, dtype=np.int16).astype(np.float32) / 32768.0

                        # 直接在线程池中运行推理
                        result = await run_in_threadpool(
                            model_instance.generate,
                            input=audio,
                            cache={},
                            language=language,
                            use_itn=True,
                            batch_size_s=60
                        )

                        if result and len(result) > 0:
                            import re
                            raw_text = result[0].get("text", "")
                            text = re.sub(r'<\|[^|]+\|>', '', raw_text).strip()

                            if text:
                                # 判断是否需要断句（与 test_svs_fy.py 完全一致的逻辑）
                                is_punctuation_end = text.endswith(('。', '？', '！', '.', '?', '!', '，', ','))
                                is_long_stable = sentence_time > 2.0 and is_punctuation_end

                                should_commit = (
                                    is_silence_trigger or
                                    is_forced_cut or
                                    is_long_stable
                                )

                                # 翻译和纠错
                                corrected_text = text
                                translation = None

                                if should_commit:
                                    # 确定断句原因
                                    if is_forced_cut:
                                        cut_reason = "force"
                                    elif is_long_stable:
                                        cut_reason = "punctuation"
                                    else:
                                        cut_reason = "silence"

                                    # 纠错（可选）
                                    if enable_correction and corrector:
                                        context = " ".join(context_memory[-3:]) if context_memory else ""
                                        corrected = await corrector.correct(text, context)
                                        if corrected and corrected != text:
                                            corrected_text = corrected
                                            logger.info(f"🔧 纠错: {text} → {corrected_text}")

                                    # 更新上下文记忆
                                    context_memory.append(corrected_text)
                                    if len(context_memory) > 5:
                                        context_memory.pop(0)

                                    # 翻译
                                    if translator:
                                        translation = await translator.translate(corrected_text, translation_mode)

                                    logger.info(f"✂️ [{cut_reason}] {corrected_text} | {translation or '(无翻译)'}")

                                    # 发送最终结果
                                    await websocket.send_json({
                                        "type": "result",
                                        "original": text,
                                        "corrected": corrected_text,
                                        "translation": translation or "",
                                        "is_final": True,
                                        "cut_reason": cut_reason
                                    })

                                    # 清空缓存
                                    sentence_buffer = []
                                    silence_duration = 0.0
                                    sentence_time = 0.0
                                    committed_text += text

                    except Exception as e:
                        logger.error(f"推理错误: {e}")

            except asyncio.TimeoutError:
                # 超时，继续等待
                continue
            except WebSocketDisconnect:
                logger.info("客户端断开连接")
                is_closing = True
                break

    except WebSocketDisconnect:
        logger.info("客户端断开连接")
    except Exception as e:
        logger.error(f"WebSocket 处理异常: {str(e)}")
        try:
            await websocket.send_json({"error": str(e), "is_final": True})
        except:
            pass
    finally:
        is_closing = True
        if translator:
            await translator.close()
        if corrector:
            await corrector.close()

        try:
            await websocket.close()
        except:
            pass


if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("🚀 FunASR 多模型语音识别与翻译服务")
    print("=" * 60)
    print("📌 模型1: FunAudioLLM/Fun-ASR-Nano-2512 (高精度离线转写)")
    print("📌 模型2: iic/SenseVoiceSmall (实时流式同传)")
    print("📌 翻译: Qwen MT Flash (中英实时翻译)")
    print("=" * 60)
    print("🔗 API 端点:")
    print("   GET  /                           - 服务信息")
    print("   GET  /health                     - 健康检查")
    print("   POST /transcribe                 - Nano 模型转写")
    print("   POST /transcribe/sensevoice      - SenseVoice 转写")
    print("   WS   /stream                     - Nano 实时流式")
    print("   WS   /stream/sensevoice          - SenseVoice 实时同传")
    print("   WS   /stream/sensevoice/translation - ⭐实时翻译")
    print("=" * 60)

    # 运行服务
    uvicorn.run(
        "funasr_service:app",
        host="0.0.0.0",
        port=10005,
        reload=False,  # 生产环境建议关闭
        log_level="info"
    )
