#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FunASR SenseVoice 本地实时识别测试
直接加载模型，本地麦克风实时识别，不走 WebSocket
用于诊断模型本身的性能和断句问题
"""

import os
import sys
from pathlib import Path

# 设置ModelScope缓存目录到本地 ./models 文件夹
# 必须在导入 funasr 之前设置
os.environ['MODELSCOPE_CACHE'] = str(Path(__file__).parent / "models")

# 抑制 FunASR 的 tqdm 进度条输出
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['PYTHONIOENCODING'] = 'utf-8'

# 先检查 PyAudio
try:
    import pyaudio
    MIC_AVAILABLE = True
except ImportError:
    MIC_AVAILABLE = False
    print("❌ PyAudio 未安装")
    print("   安装方法:")
    print("   - Arch Linux: sudo pacman -S python-pyaudio")
    print("   - pip: pip install pyaudio")
    sys.exit(1)

# 然后导入其他模块
import time
import queue
import logging
import numpy as np
from datetime import datetime
from collections import deque
import audioop

# 抑制 tqdm 和 FunASR 的日志输出
class TqdmSilence:
    """抑制 tqdm 输出"""
    def write(self, msg):
        pass  # 什么都不输出
    def flush(self):
        pass

class TqdmSuppressor:
    def __enter__(self):
        self.original_stdout = sys.stdout
        self.original_stderr = sys.stderr
        sys.stdout = TqdmSilence()
        sys.stderr = TqdmSilence()
    def __exit__(self, *args):
        sys.stdout = self.original_stdout
        sys.stderr = self.original_stderr

# 导入 FunASR 时抑制输出
with TqdmSuppressor():
    from funasr import AutoModel

# ========================================
# 配置参数
# ========================================
SAMPLE_RATE = 16000
CHANNELS = 1
CHUNK_SIZE = 1200  # 75ms chunks (温和优化，从100ms降到75ms)

# 语言配置 (zh=中文, en=英文, ja=日语, ko=韩语, yue=粤语, auto=自动)
LANGUAGE = "zh"  # 默认强制中文识别，避免误识别为日语

# 断句配置（温和优化）
SILENCE_THRESHOLD = 0.01      # 静音阈值 (0-1), RMS归一化值
MAX_SILENCE_DURATION = 0.7    # 静音多久后断句(秒) - 从0.8降到0.7
MIN_SENTENCE_DURATION = 0.5   # 句子最短时长(秒)
MAX_SENTENCE_DURATION = 12.0  # 句子最长时长，强制断句(秒) - 从15降到12
INFERENCE_INTERVAL = 0.1      # 识别间隔(秒)

# ========================================
# 日志配置
# ========================================
log_dir = Path(__file__).parent / "log"
log_dir.mkdir(exist_ok=True)
log_file = log_dir / "debug.log"

# 获取根日志器
root_logger = logging.getLogger()
root_logger.setLevel(logging.DEBUG)

# 清除现有的 handlers（如果有）
root_logger.handlers.clear()

# 文件处理器 - 详细日志
file_handler = logging.FileHandler(log_file, encoding='utf-8')
file_handler.setLevel(logging.DEBUG)
file_formatter = logging.Formatter(
    '%(asctime)s | %(levelname)-8s | [%(name)s:%(lineno)d] | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
file_handler.setFormatter(file_formatter)
root_logger.addHandler(file_handler)

# 控制台处理器 - 只显示 INFO 及以上，简洁格式
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(levelname)s: %(message)s')
console_handler.setFormatter(console_formatter)
root_logger.addHandler(console_handler)

# 创建主 logger
logger = logging.getLogger(__name__)

# 立即写入测试日志并 flush，验证文件写入
logger.info("=" * 70)
logger.info("🚀 日志系统初始化完成")
logger.info(f"📝 日志文件: {log_file}")
logger.info("=" * 70)
# 强制 flush 确保日志写入文件
for handler in root_logger.handlers:
    handler.flush()

# ========================================
# 性能统计
# ========================================
class PerformanceMonitor:
    """性能监控器"""

    def __init__(self):
        self.start_time = time.time()
        self.audio_chunks = 0
        self.inference_count = 0
        self.sentence_count = 0

        # 延迟统计 (毫秒)
        self.inference_times = deque(maxlen=100)
        self.end_to_end_latencies = deque(maxlen=100)

        # 断句统计
        self.sentence_cuts = {
            "silence": 0,
            "force": 0,
            "punctuation": 0
        }

        # 音频能量统计
        self.energy_levels = deque(maxlen=1000)

        # 当前句子状态
        self.current_sentence_start = None
        self.sentence_durations = deque(maxlen=50)

    def record_inference(self, inference_time_ms):
        self.inference_count += 1
        self.inference_times.append(inference_time_ms)

    def record_sentence_cut(self, reason, duration):
        self.sentence_count += 1
        if reason in self.sentence_cuts:
            self.sentence_cuts[reason] += 1
        if duration:
            self.sentence_durations.append(duration)

    def record_energy(self, energy):
        self.energy_levels.append(energy)

    def get_report(self):
        runtime = time.time() - self.start_time

        report = f"""
╔══════════════════════════════════════════════════════════════════════╗
║                      🔍 性能分析报告                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║ 运行统计:                                                            ║
║   运行时长:        {runtime:10.1f} 秒                                   ║
║   接收音频块:      {self.audio_chunks:10d} 块                                  ║
║   执行识别次数:    {self.inference_count:10d} 次                                  ║
║   断句数量:        {self.sentence_count:10d} 句                                  ║
╠══════════════════════════════════════════════════════════════════════╣
║ 推理性能:                                                            ║
║"""

        if self.inference_times:
            inference_array = np.array(self.inference_times)
            report += f"""║   平均推理时间:    {np.mean(inference_array):10.1f} ms                                 ║
║   中位数推理:      {np.median(inference_array):10.1f} ms                                 ║
║   最大推理时间:    {np.max(inference_array):10.1f} ms                                 ║
║   最小推理时间:    {np.min(inference_array):10.1f} ms                                 ║
║   P95 推理时间:    {np.percentile(inference_array, 95):10.1f} ms                                 ║
║   P99 推理时间:    {np.percentile(inference_array, 99):10.1f} ms                                 ║
"""
        else:
            report += f"""║   暂无推理数据                                                        ║
"""

        report += f"""╠══════════════════════════════════════════════════════════════════════╣
║ 断句分析:                                                            ║
║   静音断句:        {self.sentence_cuts['silence']:10d} 次                                  ║
║   强制断句:        {self.sentence_cuts['force']:10d} 次                                  ║
║   标点断句:        {self.sentence_cuts['punctuation']:10d} 次                                  ║
"""

        if self.sentence_durations:
            duration_array = np.array(self.sentence_durations)
            report += f"""║                                                                   ║
║   平均句子长度:    {np.mean(duration_array):10.2f} 秒                                 ║
║   最短句子:        {np.min(duration_array):10.2f} 秒                                 ║
║   最长句子:        {np.max(duration_array):10.2f} 秒                                 ║
"""

        if self.energy_levels:
            energy_array = np.array(self.energy_levels)
            report += f"""║                                                                   ║
║   平均音频能量:    {np.mean(energy_array):10.4f} RMS                                ║
║   最大音频能量:    {np.max(energy_array):10.4f} RMS                                ║
║   最小音频能量:    {np.min(energy_array):10.4f} RMS                                ║
"""

        report += f"""╠══════════════════════════════════════════════════════════════════════╣
║ 实时率计算: (处理时间 / 音频时长，越小越好)                        ║
║   目标实时率: < 1.0 (可实时处理)                                   ║
║   当前实时率: {np.mean(self.inference_times)/1000/INFERENCE_INTERVAL if self.inference_times else 0:10.2f}                                   ║
╚══════════════════════════════════════════════════════════════════════╝
"""
        return report

monitor = PerformanceMonitor()

# ========================================
# 麦克风捕获
# ========================================
try:
    import pyaudio
    MIC_AVAILABLE = True
except ImportError:
    MIC_AVAILABLE = False
    logger.error("❌ PyAudio 未安装")
    logger.error("   安装方法:")
    logger.error("   - Arch Linux: sudo pacman -S python-pyaudio")
    logger.error("   - pip: pip install pyaudio")
    sys.exit(1)


class MicrophoneCapture:
    """本地麦克风音频捕获 - 使用 stream.read() 方式（类似 Qwen）"""

    def __init__(self, rate=16000, channels=1, chunk_size=1600):
        self.rate = rate
        self.channels = channels
        self.chunk_size = chunk_size
        self.is_running = False
        self.p = None
        self.stream = None

        # 静音检测参数
        self.silence_threshold_int16 = int(32768 * SILENCE_THRESHOLD)

    def start(self):
        """启动麦克风捕获"""
        self.p = pyaudio.PyAudio()

        # 列出可用设备
        logger.info("=" * 70)
        logger.info("🎤 可用音频输入设备:")
        logger.info("=" * 70)
        input_devices = []
        for i in range(self.p.get_device_count()):
            info = self.p.get_device_info_by_index(i)
            if info['maxInputChannels'] > 0:
                input_devices.append(i)
                logger.info(f"  [{i:2d}] {info['name']}")
        logger.info("=" * 70)

        # 使用默认输入设备
        try:
            default_device = self.p.get_default_input_device_info()
            device_index = default_device['index']
            logger.info(f"✅ 使用默认设备: [{device_index}] {default_device['name']}")
        except:
            if input_devices:
                device_index = input_devices[0]
                logger.info(f"✅ 使用设备: [{device_index}]")
            else:
                raise RuntimeError("❌ 没有找到可用的音频输入设备")

        # 打开音频流（非阻塞模式）
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=self.channels,
            rate=self.rate,
            input=True,
            input_device_index=device_index,
            frames_per_buffer=self.chunk_size
        )

        self.is_running = True
        logger.info("=" * 70)
        logger.info(f"✅ 麦克风已启动")
        logger.info(f"   采样率: {self.rate} Hz")
        logger.info(f"   通道数: {self.channels}")
        logger.info(f"   块大小: {self.chunk_size} 字节 ({self.chunk_size * 8 / self.rate * 1000:.0f} ms)")
        logger.info("=" * 70)

    def read_chunk(self):
        """读取一个音频块（阻塞）"""
        if not self.is_running:
            return None

        try:
            audio_data = self.stream.read(self.chunk_size, exception_on_overflow=False)
            rms = audioop.rms(audio_data, 2) / 32768.0  # 归一化到 0-1

            monitor.record_energy(rms)
            monitor.audio_chunks += 1

            return {
                'data': audio_data,
                'rms': rms,
                'timestamp': time.time()
            }
        except Exception as e:
            logger.error(f"读取音频失败: {e}")
            return None

    def stop(self):
        """停止麦克风"""
        self.is_running = False
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        if self.p:
            self.p.terminate()
        logger.info("🎤 麦克风已停止")

# ========================================
# 实时识别引擎
# ========================================
class StreamingRecognizer:
    """流式语音识别引擎"""

    def __init__(self, model_name="iic/SenseVoiceSmall"):
        # 语言显示映射
        lang_names = {"zh": "中文", "en": "英文", "ja": "日语", "ko": "韩语", "yue": "粤语", "auto": "自动识别"}

        logger.info("=" * 70)
        logger.info("🔄 正在加载 SenseVoiceSmall 模型...")
        logger.info(f"🌐 语言设置: {lang_names.get(LANGUAGE, LANGUAGE)} ({LANGUAGE})")
        logger.info("=" * 70)

        self.model_name = model_name
        load_start = time.time()

        # 抑制模型加载时的 tqdm 输出
        with TqdmSuppressor():
            self.model = AutoModel(
                model=model_name,
                vad_model="fsmn-vad",
                vad_kwargs={"max_single_segment_time": 30000},
                device="cpu",
                disable_update=True
            )

        load_time = time.time() - load_start
        logger.info(f"✅ 模型加载完成 (耗时: {load_time:.2f} 秒)")
        logger.info("=" * 70)

        # 识别状态
        self.sentence_buffer = []  # 当前句子的音频缓存
        self.committed_text = ""   # 已提交的文本
        self.current_text = ""     # 当前正在识别的文本

        # 静音检测状态
        self.silence_duration = 0.0
        self.sentence_duration = 0.0

        # 性能追踪
        self.last_inference_time = 0.0
        self.last_recognition_time = time.time()

    def process_audio_chunk(self, audio_data, rms_energy):
        """
        处理音频块，返回识别结果

        Args:
            audio_data: PCM 音频数据 (bytes)
            rms_energy: 音频能量 (归一化 0-1)

        Returns:
            dict: {
                'text': str,           # 当前识别的文本
                'is_final': bool,      # 是否是最终结果
                'total_text': str,     # 完整文本 (已提交+当前)
                'cut_reason': str,     # 断句原因 (如果是 final)
                'inference_time': float  # 推理耗时 (ms)
            }
        """
        import re

        # 1. 将音频块加入缓存
        self.sentence_buffer.append(audio_data)
        chunk_duration = len(audio_data) / 2 / SAMPLE_RATE  # 字节转秒
        self.sentence_duration += chunk_duration

        # 2. 检测静音
        if rms_energy < SILENCE_THRESHOLD:
            self.silence_duration += chunk_duration
        else:
            self.silence_duration = 0.0

        # 3. 动态调整断句策略
        dynamic_max_silence = MAX_SILENCE_DURATION
        if self.sentence_duration > 5.0:
            dynamic_max_silence = 0.5
        elif self.sentence_duration > 8.0:
            dynamic_max_silence = 0.3

        # 4. 判断是否需要识别
        current_time = time.time()
        time_since_last_inference = current_time - self.last_inference_time

        # 判断是否需要断句
        is_silence_trigger = self.silence_duration > dynamic_max_silence
        is_forced_cut = self.sentence_duration >= MAX_SENTENCE_DURATION

        # 如果既不是静音触发也不是强制断句，且距离上次识别太近，跳过
        should_recognize = (
            is_silence_trigger or
            is_forced_cut or
            time_since_last_inference >= INFERENCE_INTERVAL
        )

        if not should_recognize:
            return None

        # 5. 执行识别
        self.last_inference_time = current_time
        inference_start = time.time()

        # 合并音频数据
        combined_audio = b''.join(self.sentence_buffer)

        try:
            # 转换为 float32 numpy 数组
            audio_np = np.frombuffer(combined_audio, dtype=np.int16).astype(np.float32) / 32768.0

            # 执行推理（抑制 tqdm 输出）
            with TqdmSuppressor():
                result = self.model.generate(
                    input=audio_np,
                    cache={},
                    language=LANGUAGE,  # 使用配置的语言
                    use_itn=True,
                    batch_size_s=60
                )

            inference_time = (time.time() - inference_start) * 1000
            monitor.record_inference(inference_time)

            # 提取文本
            if result and len(result) > 0:
                raw_text = result[0].get("text", "")
                text = re.sub(r'<\|[^|]+\|>', '', raw_text).strip()

                if text:
                    self.current_text = text

                    # 判断是否需要断句
                    is_punctuation_end = text.endswith(('。', '？', '！', '.', '?', '!', '，', ','))
                    is_long_stable = self.sentence_duration > 2.0 and is_punctuation_end

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
                        monitor.record_sentence_cut(cut_reason, self.sentence_duration)

                        # 清空缓存
                        self.sentence_buffer = []
                        self.silence_duration = 0.0
                        self.sentence_duration = 0.0

                        return {
                            'text': text,
                            'is_final': True,
                            'total_text': self.committed_text,
                            'cut_reason': cut_reason,
                            'inference_time': inference_time
                        }
                    else:
                        # 中间结果
                        return {
                            'text': text,
                            'is_final': False,
                            'total_text': self.committed_text + text,
                            'inference_time': inference_time
                        }

        except Exception as e:
            logger.error(f"❌ 识别错误: {e}")
            import traceback
            logger.error(traceback.format_exc())

        return None

# ========================================
# 主程序
# ========================================
def main():
    # 语言显示映射
    lang_names = {"zh": "中文", "en": "英文", "ja": "日语", "ko": "韩语", "yue": "粤语", "auto": "自动识别"}
    lang_display = lang_names.get(LANGUAGE, LANGUAGE)

    print(f"""
╔══════════════════════════════════════════════════════════════════════╗
║     FunASR SenseVoice 本地实时识别测试                              ║
╠══════════════════════════════════════════════════════════════════════╣
║  配置:                                                                ║
║    • 语言模式: {lang_display:<6s} ({LANGUAGE})                                          ║
║    • 麦克风:   本地实时捕获                                           ║
║                                                                      ║
║  操作说明:                                                           ║
║    - 请对麦克风说话                                                 ║
║    - 按 Ctrl+C 停止测试                                             ║
╚══════════════════════════════════════════════════════════════════════╝
""")

    # 启动麦克风
    mic = MicrophoneCapture(
        rate=SAMPLE_RATE,
        channels=CHANNELS,
        chunk_size=CHUNK_SIZE
    )
    mic.start()

    # 加载模型
    recognizer = StreamingRecognizer()

    logger.info("=" * 70)
    logger.info("🎯 开始实时识别")
    logger.info("=" * 70)

    try:
        while True:
            # 直接读取音频块（阻塞）
            audio_item = mic.read_chunk()

            if audio_item is None:
                continue

            # 处理识别
            result = recognizer.process_audio_chunk(
                audio_item['data'],
                audio_item['rms']
            )

            if result:
                # 输出结果
                if result['is_final']:
                    # 最终结果 - 固定显示
                    print(f"\r✅ [{result['cut_reason']:10s}] {result['text']}", end='', flush=True)
                    # 记录到日志
                    logger.info(
                        f"✅ [FINAL] 断句原因: {result['cut_reason']}, "
                        f"推理时间: {result['inference_time']:.1f}ms, "
                        f"文本: {result['text']}"
                    )
                else:
                    # 中间结果 - 实时更新
                    print(f"\r⏳ [LIVE ] {result['text']:<50s}", end='', flush=True)

    except KeyboardInterrupt:
        logger.info("\n" + "=" * 70)
        logger.info("⚠️  收到停止信号")
    except Exception as e:
        logger.error(f"❌ 错误: {e}")
        import traceback
        logger.error(traceback.format_exc())
    finally:
        mic.stop()
        print("\n")
        print(monitor.get_report())
        logger.info(f"📝 详细日志: {log_file}")
        # 确保所有日志写入文件
        for handler in logging.getLogger().handlers:
            if isinstance(handler, logging.FileHandler):
                handler.flush()
                handler.close()

if __name__ == "__main__":
    main()
