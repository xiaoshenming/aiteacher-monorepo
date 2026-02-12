"""
DashScope 图片生成提供者 - 专为 PPT 场景优化
支持 Qwen-Image 和 Wanx 系列模型的异步调用
推荐使用 wan2.6-t2i 获得最佳效果
"""

import asyncio
import logging
import time
from typing import Dict, Any, Optional, List
from pathlib import Path
import aiohttp
import json

from .base import ImageGenerationProvider
from ..models import (
    ImageInfo, ImageGenerationRequest, ImageOperationResult,
    ImageProvider, ImageSourceType, ImageFormat, ImageMetadata, ImageTag
)

logger = logging.getLogger(__name__)


class DashScopeImageProvider(ImageGenerationProvider):
    """
    DashScope 图片生成提供者

    专为 PPT 场景优化，推荐使用 wan2.6-t2i 模型：
    - 支持复杂中文文字渲染
    - 写实摄影风格，适合专业演示
    - 灵活的分辨率支持（512-1440px）
    - 异步调用，不阻塞服务器
    """

    # 支持的模型配置
    MODELS = {
        # 万相系列（推荐用于 PPT）
        'wan2.6-t2i': {
            'name': '万相 2.6',
            'description': '最新万相模型，擅长写实摄影和复杂文字',
            'async_only': True,
            'flexible_size': True,
            'size_range': (512, 1440),
            'recommended_sizes': ['1440*810', '1024*1024', '1440*1080']
        },
        'wan2.5-t2i-preview': {
            'name': '万相 2.5 预览版',
            'description': '万相 2.5 预览版',
            'async_only': True,
            'flexible_size': True,
            'size_range': (512, 1440)
        },
        'wan2.2-t2i-flash': {
            'name': '万相 2.2 Flash',
            'description': '快速生成，支持自定义分辨率',
            'async_only': True,
            'flexible_size': True,
            'size_range': (512, 1440)
        },
        # 千问系列（擅长文字渲染）
        'qwen-image-max': {
            'name': '千问 Image Max',
            'description': '最高质量，擅长复杂文字渲染',
            'async_only': False,
            'flexible_size': False,
            'fixed_sizes': ['1664*928', '1472*1104', '1328*1328', '1104*1472', '928*1664']
        },
        'qwen-image-plus': {
            'name': '千问 Image Plus',
            'description': '高质量文字渲染',
            'async_only': False,
            'flexible_size': False,
            'fixed_sizes': ['1664*928', '1472*1104', '1328*1328', '1104*1472', '928*1664']
        },
        'qwen-image': {
            'name': '千问 Image',
            'description': '标准质量',
            'async_only': False,
            'flexible_size': False,
            'fixed_sizes': ['1664*928', '1472*1104', '1328*1328', '1104*1472', '928*1664']
        }
    }

    def __init__(self, config: Dict[str, Any]):
        super().__init__(ImageProvider.DASHSCOPE, config)

        # API配置
        self.api_key = config.get('api_key')
        self.api_base = config.get('api_base', 'https://dashscope.aliyuncs.com/api/v1')
        self.model = config.get('model', 'wan2.2-t2i-flash')  # 默认使用 wan2.2-t2i-flash（支持灵活分辨率）

        # 生成参数
        self.default_size = config.get('default_size', '1440*810')  # 16:9 适合 PPT
        self.prompt_extend = config.get('prompt_extend', True)  # 智能改写提示词
        self.watermark = config.get('watermark', False)

        # 异步轮询配置
        self.poll_interval_initial = config.get('poll_interval_initial', 3)  # 初始轮询间隔（秒）
        self.poll_interval_max = config.get('poll_interval_max', 10)  # 最大轮询间隔（秒）
        self.poll_timeout = config.get('poll_timeout', 120)  # 轮询超时（秒）

        # 速率限制
        self.rate_limit_requests = config.get('rate_limit_requests', 50)
        self.rate_limit_window = config.get('rate_limit_window', 60)
        self._request_history = []

        if not self.api_key:
            logger.warning("DashScope API key not configured")

        # 验证模型配置
        if self.model not in self.MODELS:
            logger.warning(f"Unknown model {self.model}, falling back to wan2.6-t2i")
            self.model = 'wan2.6-t2i'

    async def generate(self, request: ImageGenerationRequest) -> ImageOperationResult:
        """生成图片"""
        if not self.api_key:
            return ImageOperationResult(
                success=False,
                message="DashScope API key not configured",
                error_code="api_key_missing"
            )

        try:
            if not await self._check_rate_limit():
                return ImageOperationResult(
                    success=False,
                    message="Rate limit exceeded",
                    error_code="rate_limit_exceeded"
                )

            model_config = self.MODELS[self.model]

            # 根据模型选择调用方式
            if model_config['async_only']:
                return await self._generate_async(request)
            else:
                # 千问模型支持同步调用
                return await self._generate_sync(request)

        except asyncio.TimeoutError:
            logger.error("DashScope API request timeout")
            return ImageOperationResult(
                success=False,
                message="Request timeout",
                error_code="timeout"
            )
        except Exception as e:
            logger.error(f"DashScope Image generation failed: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Generation failed: {str(e)}",
                error_code="generation_error"
            )

    async def _generate_async(self, request: ImageGenerationRequest) -> ImageOperationResult:
        """
        异步生成图片（用于万相系列）

        流程：
        1. 提交任务，获取 task_id
        2. 轮询任务状态，直到完成或超时
        3. 下载生成的图片
        """
        # 步骤1: 提交任务
        task_id = await self._submit_task(request)
        if not task_id:
            return ImageOperationResult(
                success=False,
                message="Failed to submit task",
                error_code="task_submission_failed"
            )

        logger.info(f"DashScope task submitted: {task_id}")

        # 步骤2: 轮询任务状态
        result_data = await self._poll_task(task_id)
        if not result_data:
            return ImageOperationResult(
                success=False,
                message="Task polling timeout or failed",
                error_code="task_polling_failed"
            )

        # 步骤3: 处理结果
        return await self._process_api_response(result_data, request)

    async def _submit_task(self, request: ImageGenerationRequest) -> Optional[str]:
        """提交异步任务"""
        api_request = self._prepare_api_request(request)
        url = f"{self.api_base.rstrip('/')}/services/aigc/text2image/image-synthesis"

        # 调试日志
        logger.debug(f"DashScope API URL: {url}")
        logger.debug(f"DashScope API request: {api_request}")

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "X-DashScope-Async": "enable"  # 启用异步模式
                    },
                    json=api_request,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:

                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"DashScope task submission error {response.status}: {error_text}")
                        logger.error(f"Request URL was: {url}")
                        logger.error(f"Request body was: {api_request}")
                        return None

                    result = await response.json()

                    # 检查响应
                    if result.get('code'):
                        logger.error(f"DashScope API error: {result.get('message')}")
                        return None

                    # 获取 task_id
                    output = result.get('output', {})
                    task_id = output.get('task_id')

                    if not task_id:
                        logger.error("No task_id in response")
                        return None

                    return task_id

        except Exception as e:
            logger.error(f"Failed to submit task: {e}")
            return None

    async def _poll_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        轮询任务状态

        使用指数退避策略：
        - 前30秒: 每3秒轮询一次
        - 之后: 逐渐增加间隔，最多10秒
        """
        url = f"{self.api_base.rstrip('/')}/tasks/{task_id}"
        start_time = time.time()
        poll_interval = self.poll_interval_initial

        try:
            async with aiohttp.ClientSession() as session:
                while True:
                    # 检查超时
                    elapsed = time.time() - start_time
                    if elapsed > self.poll_timeout:
                        logger.error(f"Task {task_id} polling timeout after {elapsed:.1f}s")
                        return None

                    # 轮询任务状态
                    async with session.get(
                        url,
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        timeout=aiohttp.ClientTimeout(total=10)
                    ) as response:

                        if response.status != 200:
                            error_text = await response.text()
                            logger.error(f"Task polling error {response.status}: {error_text}")
                            return None

                        result = await response.json()

                        # 检查任务状态
                        output = result.get('output', {})
                        task_status = output.get('task_status')

                        if task_status == 'SUCCEEDED':
                            logger.info(f"Task {task_id} succeeded after {elapsed:.1f}s")
                            return result

                        elif task_status == 'FAILED':
                            error_msg = output.get('message', 'Unknown error')
                            logger.error(f"Task {task_id} failed: {error_msg}")
                            return None

                        elif task_status in ['PENDING', 'RUNNING']:
                            # 任务进行中，继续轮询
                            logger.debug(f"Task {task_id} status: {task_status}, elapsed: {elapsed:.1f}s")

                            # 等待后继续
                            await asyncio.sleep(poll_interval)

                            # 调整轮询间隔（指数退避）
                            if elapsed > 30:
                                poll_interval = min(poll_interval * 1.5, self.poll_interval_max)

                        else:
                            logger.error(f"Unknown task status: {task_status}")
                            return None

        except Exception as e:
            logger.error(f"Task polling exception: {e}")
            return None

    async def _generate_sync(self, request: ImageGenerationRequest) -> ImageOperationResult:
        """同步生成图片（用于千问系列）"""
        api_request = self._prepare_api_request(request)
        url = f"{self.api_base.rstrip('/')}/services/aigc/text2image/image-synthesis"

        async with aiohttp.ClientSession() as session:
            async with session.post(
                url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                    # 不设置 X-DashScope-Async，使用同步模式
                },
                json=api_request,
                timeout=aiohttp.ClientTimeout(total=180)
            ) as response:

                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"DashScope API error {response.status}: {error_text}")
                    return ImageOperationResult(
                        success=False,
                        message=f"DashScope API error: {response.status}",
                        error_code="api_error"
                    )

                result_data = await response.json()

        return await self._process_api_response(result_data, request)

    def _prepare_api_request(self, request: ImageGenerationRequest) -> Dict[str, Any]:
        """准备API请求"""
        # 调整尺寸格式
        size = self._adjust_size(request.width, request.height)

        # 准备负向提示词
        negative_prompt = request.negative_prompt if request.negative_prompt else "模糊,低质量,变形,多余的手指,文字错误"

        api_request = {
            "model": self.model,
            "input": {
                "prompt": request.prompt
            },
            "parameters": {
                "size": size,
                "n": 1,
                "negative_prompt": negative_prompt,  # 负向提示词在 parameters 里
                "prompt_extend": self.prompt_extend,
                "watermark": self.watermark
            }
        }

        return api_request

    def _adjust_size(self, width: int, height: int) -> str:
        """
        调整尺寸以符合模型要求

        - 万相: 支持 [512, 1440] 范围内任意组合
        - 千问: 只支持固定的5种尺寸
        """
        model_config = self.MODELS[self.model]

        if model_config['flexible_size']:
            # 万相模型：确保在范围内
            min_size, max_size = model_config['size_range']
            width = max(min_size, min(width, max_size))
            height = max(min_size, min(height, max_size))

            # 确保总像素不超过 1440*1440
            if width * height > 1440 * 1440:
                ratio = (1440 * 1440 / (width * height)) ** 0.5
                width = int(width * ratio)
                height = int(height * ratio)

            return f"{width}*{height}"
        else:
            # 千问模型：选择最接近的固定尺寸
            fixed_sizes = model_config['fixed_sizes']
            target_ratio = width / height

            best_size = fixed_sizes[0]
            best_diff = float('inf')

            for size_str in fixed_sizes:
                w, h = map(int, size_str.split('*'))
                ratio = w / h
                diff = abs(ratio - target_ratio)
                if diff < best_diff:
                    best_diff = diff
                    best_size = size_str

            return best_size

    async def _process_api_response(self,
                                    response_data: Dict[str, Any],
                                    request: ImageGenerationRequest) -> ImageOperationResult:
        """处理API响应"""
        try:
            # 检查响应状态
            if response_data.get('code'):
                error_msg = response_data.get('message', 'Unknown error')
                logger.error(f"DashScope API error: {error_msg}")
                return ImageOperationResult(
                    success=False,
                    message=f"API error: {error_msg}",
                    error_code="api_error"
                )

            # 获取输出数据
            output = response_data.get('output', {})
            results = output.get('results', [])

            if not results:
                return ImageOperationResult(
                    success=False,
                    message="No image data in response",
                    error_code="no_data"
                )

            # 获取第一张图片的URL
            image_url = results[0].get('url')
            if not image_url:
                return ImageOperationResult(
                    success=False,
                    message="No image URL in response",
                    error_code="no_image"
                )

            # 下载图片
            image_path, image_size = await self._download_image(image_url, request)

            # 创建图片信息
            image_info = self._create_image_info(
                image_path, image_size, request
            )

            return ImageOperationResult(
                success=True,
                message="Image generated successfully",
                image_info=image_info
            )

        except Exception as e:
            logger.error(f"Failed to process DashScope response: {e}")
            return ImageOperationResult(
                success=False,
                message=f"Failed to process response: {str(e)}",
                error_code="response_processing_error"
            )

    async def _download_image(self,
                              image_url: str,
                              request: ImageGenerationRequest) -> tuple[Path, int]:
        """下载生成的图片"""
        timestamp = int(time.time())
        filename = f"dashscope_{self.model}_{timestamp}_{hash(request.prompt) % 10000}.png"

        save_dir = Path("temp/images_cache/ai_generated/dashscope")
        save_dir.mkdir(parents=True, exist_ok=True)
        image_path = save_dir / filename

        async with aiohttp.ClientSession() as session:
            async with session.get(image_url, timeout=aiohttp.ClientTimeout(total=60)) as response:
                if response.status != 200:
                    raise Exception(f"Failed to download image: {response.status}")

                image_data = await response.read()

                with open(image_path, 'wb') as f:
                    f.write(image_data)

                return image_path, len(image_data)

    def _create_image_info(self,
                           image_path: Path,
                           image_size: int,
                           request: ImageGenerationRequest) -> ImageInfo:
        """创建图片信息"""
        image_id = f"dashscope_{int(time.time())}_{hash(request.prompt) % 10000}"
        width, height = request.width, request.height

        metadata = ImageMetadata(
            width=width,
            height=height,
            format=ImageFormat.PNG,
            file_size=image_size,
            color_mode="RGB",
            has_transparency=False
        )

        tags = self._generate_tags_from_prompt(request.prompt)

        return ImageInfo(
            image_id=image_id,
            filename=image_path.name,
            title=f"AI Generated: {request.prompt[:50]}...",
            description=f"Generated by DashScope {self.model} with prompt: {request.prompt}",
            alt_text=request.prompt,
            source_type=ImageSourceType.AI_GENERATED,
            provider=ImageProvider.DASHSCOPE,
            original_url="",
            local_path=str(image_path),
            metadata=metadata,
            tags=tags,
            keywords=self._extract_keywords_from_prompt(request.prompt),
            usage_count=0,
            created_at=time.time(),
            updated_at=time.time()
        )

    def _generate_tags_from_prompt(self, prompt: str) -> List[ImageTag]:
        """从提示词生成标签"""
        keywords = prompt.lower().split()
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = [word for word in keywords if word not in stop_words and len(word) > 2]

        tags = []
        for i, keyword in enumerate(keywords[:10]):
            confidence = max(0.5, 1.0 - i * 0.1)
            tags.append(ImageTag(
                name=keyword,
                confidence=confidence,
                category="ai_generated"
            ))

        return tags

    def _extract_keywords_from_prompt(self, prompt: str) -> List[str]:
        """从提示词提取关键词"""
        words = prompt.lower().split()
        stop_words = {'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        keywords = [word for word in words if word not in stop_words and len(word) > 2]
        return keywords[:20]

    async def _check_rate_limit(self) -> bool:
        """检查速率限制"""
        current_time = time.time()

        self._request_history = [
            req_time for req_time in self._request_history
            if current_time - req_time < self.rate_limit_window
        ]

        if len(self._request_history) >= self.rate_limit_requests:
            return False

        self._request_history.append(current_time)
        return True

    async def health_check(self) -> Dict[str, Any]:
        """健康检查"""
        if not self.api_key:
            return {
                'status': 'unhealthy',
                'message': 'API key not configured',
                'provider': self.provider.value
            }

        model_config = self.MODELS.get(self.model, {})
        return {
            'status': 'healthy',
            'message': 'DashScope provider configured',
            'provider': self.provider.value,
            'model': self.model,
            'model_name': model_config.get('name', self.model),
            'async_mode': model_config.get('async_only', False)
        }

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """获取可用模型列表"""
        return [
            {
                'id': model_id,
                'name': config['name'],
                'description': config['description'],
                'async_only': config['async_only'],
                'flexible_size': config['flexible_size'],
                'recommended': model_id == 'wan2.6-t2i'  # 推荐模型
            }
            for model_id, config in self.MODELS.items()
        ]
