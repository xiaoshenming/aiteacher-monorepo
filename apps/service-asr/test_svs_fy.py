#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FunASR SenseVoice + Qwen 翻译 实时语音翻译系统
本地语音识别 + 在线翻译对照显示
"""

import os
import sys
from pathlib import Path

# 设置ModelScope缓存目录
os.environ['MODELSCOPE_CACHE'] = str(Path(__file__).parent / "models")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['PYTHONIOENCODING'] = 'utf-8'

# 加载 .env 文件
from dotenv import load_dotenv
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

# PyAudio 检查
try:
    import pyaudio
except ImportError:
    print("❌ PyAudio 未安装")
    print("   安装: sudo pacman -S python-pyaudio")
    sys.exit(1)

import time
import logging
import numpy as np
import asyncio
import httpx
from collections import deque
import audioop
import re
from typing import Optional

# 抑制 tqdm 输出
class TqdmSilence:
    def write(self, msg): pass
    def flush(self): pass

class TqdmSuppressor:
    def __enter__(self):
        self.stdout = sys.stdout
        self.stderr = sys.stderr
        sys.stdout = TqdmSilence()
        sys.stderr = TqdmSilence()
    def __exit__(self, *args):
        sys.stdout = self.stdout
        sys.stderr = self.stderr

# 导入 FunASR
with TqdmSuppressor():
    from funasr import AutoModel

# ========================================
# 配置参数
# ========================================
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 1200  # 75ms

# 语音识别语言
LANGUAGE = "en"  # zh=中文, en=英文, ja=日语

# 翻译配置
TRANSLATION_MODE = "en2zh"  # zh2en=中译英, en2zh=英译中
TRANSLATION_MODEL = "qwen-mt-flash"  # 或 qwen-mt-lite

# 纠错配置
ENABLE_CORRECTION = True  # 启用识别结果纠错
CORRECTION_MODEL = "qwen-plus"  # 纠错模型：qwen-turbo, qwen-plus, qwen-max

# 断句配置（和 test_svs.py 保持一致）
SILENCE_THRESHOLD = 0.01
MAX_SILENCE_DURATION = 0.7
MIN_SENTENCE_DURATION = 0.5
MAX_SENTENCE_DURATION = 12.0
INFERENCE_INTERVAL = 0.1

# 翻译专用：断句等待时间（稍微延迟一点断句，让句子更完整）
TRANSLATION_WAIT_TIME = 0.3  # 断句后等待0.3秒再翻译

# Qwen API 配置
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "")
QWEN_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"

# ========================================
# 日志配置
# ========================================
log_dir = Path(__file__).parent / "log"
log_dir.mkdir(exist_ok=True)
log_file = log_dir / "translation.log"

# 获取根日志器（确保全局有效）
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# 清除所有现有的 handlers
root_logger.handlers.clear()

# 文件处理器 - 详细日志
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter(
    '%(asctime)s | %(message)s',
    datefmt='%H:%M:%S'
)
file_handler.setFormatter(file_formatter)
root_logger.addHandler(file_handler)

# 控制台处理器 - 简洁输出
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(message)s')
console_handler.setFormatter(console_formatter)
root_logger.addHandler(console_handler)

# 创建主 logger（继承根日志器配置）
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# 立即写入测试日志并强制 flush，验证文件写入
logger.info("=" * 70)
logger.info("🚀 实时语音翻译系统日志初始化完成")
logger.info(f"📝 日志文件: {log_file}")
logger.info("=" * 70)

# 强制 flush 确保日志写入文件
for handler in root_logger.handlers:
    handler.flush()

# ========================================
# Qwen 纠错客户端
# ========================================
class QwenCorrector:
    """Qwen 文本纠错客户端 - 修正语音识别错误"""

    def __init__(self, api_key: str, model: str = "qwen-plus"):
        self.api_key = api_key
        self.model = model
        self.client = None
        logger.info(f"🔧 纠错模型: {model}")

    async def init(self):
        """初始化 HTTP 客户端"""
        self.client = httpx.AsyncClient(
            base_url=QWEN_BASE_URL,
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
                "temperature": 0.1,  # 低温度保证稳定性
                "max_tokens": 200
            }

            response = await self.client.post("/", json=payload)
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

    def __init__(self, api_key: str, mode: str = "zh2en"):
        self.api_key = api_key
        self.mode = mode
        self.client = None

        # 翻译方向配置
        if mode == "zh2en":
            self.source_lang = "zh"
            self.target_lang = "English"
            self.display_name = "中译英"
        elif mode == "en2zh":
            self.source_lang = "en"
            self.target_lang = "Chinese"
            self.display_name = "英译中"
        else:
            raise ValueError(f"不支持的翻译模式: {mode}")

        logger.info(f"🌐 翻译模式: {self.display_name}")

    async def init(self):
        """初始化 HTTP 客户端"""
        self.client = httpx.AsyncClient(
            base_url=QWEN_BASE_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=10.0
        )

    async def translate(self, text: str) -> Optional[str]:
        """翻译文本"""
        if not text or not self.client:
            return None

        try:
            payload = {
                "model": TRANSLATION_MODEL,
                "messages": [{"role": "user", "content": text}],
                "translation_options": {
                    "source_lang": "auto" if self.mode == "zh2en" else "English",
                    "target_lang": self.target_lang
                }
            }

            response = await self.client.post("/", json=payload)
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
# 语音识别引擎
# ========================================
class StreamingRecognizer:
    """流式语音识别"""

    def __init__(self):
        logger.info("🔄 加载 SenseVoice 模型...")
        load_start = time.time()

        with TqdmSuppressor():
            self.model = AutoModel(
                model="iic/SenseVoiceSmall",
                vad_model="fsmn-vad",
                vad_kwargs={"max_single_segment_time": 30000},
                device="cpu",
                disable_update=True
            )

        logger.info(f"✅ 模型加载完成 ({time.time() - load_start:.2f}s)")

        # 状态（和 test_svs.py 完全一致）
        self.buffer = []
        self.committed_text = ""   # 已提交的文本
        self.current_text = ""     # 当前正在识别的文本
        self.silence_time = 0.0
        self.sentence_time = 0.0

        # 性能追踪
        self.last_inference_time = 0.0
        self.last_recognition_time = time.time()

    def process(self, audio_data, rms_energy):
        """处理音频"""
        chunk_duration = len(audio_data) / 2 / SAMPLE_RATE

        self.buffer.append(audio_data)
        self.sentence_time += chunk_duration

        # 静音检测
        if rms_energy < SILENCE_THRESHOLD:
            self.silence_time += chunk_duration
        else:
            self.silence_time = 0.0

        # 动态断句
        dynamic_silence = MAX_SILENCE_DURATION
        if self.sentence_time > 5.0:
            dynamic_silence = 0.5
        elif self.sentence_time > 8.0:
            dynamic_silence = 0.3

        current_time = time.time()
        should_recognize = (
            self.silence_time > dynamic_silence or
            self.sentence_time >= MAX_SENTENCE_DURATION or
            (current_time - getattr(self, 'last_inference_time', 0)) >= INFERENCE_INTERVAL
        )

        if not should_recognize:
            return None

        self.last_inference_time = current_time
        inference_start = time.time()

        combined = b''.join(self.buffer)

        try:
            audio_np = np.frombuffer(combined, dtype=np.int16).astype(np.float32) / 32768.0

            with TqdmSuppressor():
                result = self.model.generate(
                    input=audio_np,
                    cache={},
                    language=LANGUAGE,
                    use_itn=True,
                    batch_size_s=60
                )

            inference_time = (time.time() - inference_start) * 1000

            if result and len(result) > 0:
                raw_text = result[0].get("text", "")
                text = re.sub(r'<\|[^|]+\|>', '', raw_text).strip()

                if text:
                    # 更新当前文本（用于中间结果显示）
                    self.current_text = text

                    # 判断是否需要断句（和 test_svs.py 完全一致的逻辑）
                    is_punctuation_end = text.endswith(('。', '？', '！', '.', '?', '!', '，', ','))
                    is_long_stable = self.sentence_time > 2.0 and is_punctuation_end

                    # 三种断句触发条件
                    is_silence_trigger = self.silence_time > dynamic_silence
                    is_forced_cut = self.sentence_time >= MAX_SENTENCE_DURATION

                    should_commit = (
                        is_silence_trigger or
                        is_forced_cut or
                        is_long_stable
                    )

                    if should_commit:
                        # 确定断句原因
                        if is_forced_cut:
                            cut_reason = "force"
                        elif is_long_stable:
                            cut_reason = "punctuation"
                        else:
                            cut_reason = "silence"

                        # 提交句子
                        self.committed_text += text

                        # 清空缓存
                        self.buffer = []
                        self.silence_time = 0.0
                        self.sentence_time = 0.0

                        return {
                            'text': text,
                            'is_final': True,
                            'time_ms': inference_time,
                            'cut_reason': cut_reason,
                            'total_text': self.committed_text  # 添加完整文本
                        }

        except Exception as e:
            logger.error(f"识别错误: {e}")

        return None

# ========================================
# 麦克风捕获
# ========================================
class MicrophoneCapture:
    """麦克风捕获"""

    def __init__(self, rate=16000, channels=1, chunk_size=1200):
        self.rate = rate
        self.channels = channels
        self.chunk_size = chunk_size
        self.is_running = False
        self.p = None
        self.stream = None

    def start(self):
        self.p = pyaudio.PyAudio()

        try:
            default = self.p.get_default_input_device_info()
            device_index = default['index']
            logger.info(f"🎤 麦克风: {default['name'][:40]}")
        except:
            device_index = 0

        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=self.channels,
            rate=self.rate,
            input=True,
            input_device_index=device_index,
            frames_per_buffer=self.chunk_size
        )

        self.is_running = True
        logger.info(f"✅ 麦克风已启动 ({self.rate}Hz)")

    def read(self):
        if not self.is_running:
            return None

        try:
            data = self.stream.read(self.chunk_size, exception_on_overflow=False)
            rms = audioop.rms(data, 2) / 32768.0
            return {'data': data, 'rms': rms}
        except:
            return None

    def stop(self):
        self.is_running = False
        if self.stream:
            self.stream.close()
        if self.p:
            self.p.terminate()

# ========================================
# 主程序
# ========================================
async def main():
    if not DASHSCOPE_API_KEY:
        print("❌ 未找到 DASHSCOPE_API_KEY")
        print("   请在 .env 文件中配置 API Key")
        return

    mode_display = {"zh2en": "中文 → English", "en2zh": "English → 中文"}
    lang_display = {"zh": "中文", "en": "英文"}

    correction_status = f"✅ 已启用 ({CORRECTION_MODEL})" if ENABLE_CORRECTION else "❌ 未启用"

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║        实时语音翻译系统 (FunASR + Qwen)                      ║
╠══════════════════════════════════════════════════════════════╣
║  配置:                                                        ║
║    • 识别语言: {lang_display.get(LANGUAGE, LANGUAGE):<10s}                                 ║
║    • 翻译方向: {mode_display.get(TRANSLATION_MODE, TRANSLATION_MODE):<20s}                    ║
║    • 翻译模型: {TRANSLATION_MODEL:<20s}                          ║
║    • 智能纠错: {correction_status:<20s}                          ║
║                                                              ║
║  处理流程:                                                    ║
║    1️⃣  语音识别 → 2️⃣  智能纠错 → 3️⃣  翻译输出                      ║
║                                                              ║
║  按 Ctrl+C 停止                                               ║
╚══════════════════════════════════════════════════════════════╝
""")

    # 初始化
    translator = QwenTranslator(DASHSCOPE_API_KEY, TRANSLATION_MODE)
    await translator.init()

    # 纠错器（可选）
    corrector = None
    if ENABLE_CORRECTION:
        corrector = QwenCorrector(DASHSCOPE_API_KEY, CORRECTION_MODEL)
        await corrector.init()

    recognizer = StreamingRecognizer()
    mic = MicrophoneCapture(rate=SAMPLE_RATE, channels=CHANNELS, chunk_size=CHUNK_SIZE)
    mic.start()

    stats = {"recognized": 0, "corrected": 0, "translated": 0, "failed": 0, "cuts": {"silence": 0, "force": 0, "punctuation": 0}}

    # 上下文记忆（用于纠错）
    context_memory = []

    try:
        while True:
            audio_item = mic.read()
            if audio_item is None:
                continue

            result = recognizer.process(audio_item['data'], audio_item['rms'])

            if result and result.get('is_final'):
                text = result['text']
                cut_reason = result.get('cut_reason', 'unknown')
                stats["recognized"] += 1
                stats["cuts"][cut_reason] += 1

                # 显示原文（带断句原因）
                reason_symbols = {"silence": "⏸️", "force": "⚡", "punctuation": "✂️"}
                symbol = reason_symbols.get(cut_reason, "•")
                print(f"\r{symbol} [{cut_reason:10s}] {text}")

                # 获取上下文（最近3句）
                context = " ".join(context_memory[-3:]) if context_memory else ""

                # 纠错（可选）
                corrected_text = text
                if ENABLE_CORRECTION and corrector:
                    print(f"🔧 纠错中...", end='', flush=True)
                    corrected = await corrector.correct(text, context)
                    if corrected and corrected != text:
                        corrected_text = corrected
                        stats["corrected"] += 1
                        print(f"\r✅ 已修正: {corrected_text}")
                    else:
                        print(f"\r⊙ 无需修正")

                # 更新上下文记忆
                context_memory.append(corrected_text)
                if len(context_memory) > 5:  # 只保留最近5句
                    context_memory.pop(0)

                # 翻译
                translation = await translator.translate(corrected_text)

                if translation:
                    stats["translated"] += 1
                    # 显示译文
                    print(f"🌐 译文: {translation}")

                    # 记录日志
                    if corrected_text != text:
                        logger.info(f"[{cut_reason}] 原文: {text} | 修正: {corrected_text} | 译文: {translation}")
                    else:
                        logger.info(f"[{cut_reason}] {corrected_text} | {translation}")

                    # 实时 flush 日志到文件
                    for handler in logging.getLogger().handlers:
                        if isinstance(handler, logging.FileHandler):
                            handler.flush()
                else:
                    stats["failed"] += 1
                    print(f"⚠️  翻译失败")

                print()  # 空行分隔

    except KeyboardInterrupt:
        print("\n\n" + "=" * 60)
        print("📊 统计信息")
        print("=" * 60)
        print(f"识别句子: {stats['recognized']}")
        if ENABLE_CORRECTION:
            print(f"纠错修正: {stats['corrected']}")
        print(f"翻译成功: {stats['translated']}")
        print(f"翻译失败: {stats['failed']}")
        if stats['recognized'] > 0:
            success_rate = stats['translated'] / stats['recognized'] * 100
            print(f"成功率:   {success_rate:.1f}%")
        print()
        print("断句统计:")
        print(f"  静音断句: {stats['cuts']['silence']}")
        print(f"  强制断句: {stats['cuts']['force']}")
        print(f"  标点断句: {stats['cuts']['punctuation']}")
    finally:
        mic.stop()
        await translator.close()
        if corrector:
            await corrector.close()

        # 确保所有日志写入文件
        for handler in logging.getLogger().handlers:
            if isinstance(handler, logging.FileHandler):
                handler.flush()
                handler.close()

        logger.info(f"📝 详细日志: {log_file}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
