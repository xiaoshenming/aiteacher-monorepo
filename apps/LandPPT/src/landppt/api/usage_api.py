"""
AI Usage Statistics API for LandPPT
Provides endpoints for tracking and querying AI usage per user.
"""

import time
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case
from pydantic import BaseModel

from ..database.database import get_db
from ..database.models import AIUsageLog, User

logger = logging.getLogger(__name__)
router = APIRouter()


class AIUsageLogRequest(BaseModel):
    """Request to log an AI usage event"""
    user_id: int
    project_id: Optional[str] = None
    action: str
    provider: str
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    total_tokens: int = 0
    success: bool = True
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None


@router.post("/api/usage/log")
async def log_ai_usage(
    req: AIUsageLogRequest,
    db: Session = Depends(get_db)
):
    """Log an AI usage event"""
    try:
        log_entry = AIUsageLog(
            user_id=req.user_id,
            project_id=req.project_id,
            action=req.action,
            provider=req.provider,
            model=req.model,
            input_tokens=req.input_tokens,
            output_tokens=req.output_tokens,
            total_tokens=req.total_tokens,
            success=req.success,
            error_message=req.error_message,
            duration_ms=req.duration_ms,
            created_at=time.time()
        )
        db.add(log_entry)
        db.commit()
        return {"success": True, "id": log_entry.id}
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to log AI usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/usage/stats")
async def get_usage_stats(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    start_time: Optional[float] = Query(None, description="Start timestamp"),
    end_time: Optional[float] = Query(None, description="End timestamp"),
    db: Session = Depends(get_db)
):
    """Get aggregated AI usage statistics"""
    try:
        query = db.query(
            func.count(AIUsageLog.id).label("total_calls"),
            func.sum(AIUsageLog.input_tokens).label("total_input_tokens"),
            func.sum(AIUsageLog.output_tokens).label("total_output_tokens"),
            func.sum(AIUsageLog.total_tokens).label("total_tokens"),
            func.sum(case(
                (AIUsageLog.success == True, 1),
                else_=0
            )).label("success_count"),
            func.sum(case(
                (AIUsageLog.success == False, 1),
                else_=0
            )).label("failure_count"),
        )

        filters = []
        if user_id is not None:
            filters.append(AIUsageLog.user_id == user_id)
        if start_time is not None:
            filters.append(AIUsageLog.created_at >= start_time)
        if end_time is not None:
            filters.append(AIUsageLog.created_at <= end_time)

        if filters:
            query = query.filter(and_(*filters))

        result = query.first()

        return {
            "success": True,
            "stats": {
                "total_calls": result.total_calls or 0,
                "total_input_tokens": result.total_input_tokens or 0,
                "total_output_tokens": result.total_output_tokens or 0,
                "total_tokens": result.total_tokens or 0,
                "success_count": result.success_count or 0,
                "failure_count": result.failure_count or 0,
            }
        }
    except Exception as e:
        logger.error(f"Failed to get usage stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/usage/details")
async def get_usage_details(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    start_time: Optional[float] = Query(None, description="Start timestamp"),
    end_time: Optional[float] = Query(None, description="End timestamp"),
    limit: int = Query(100, description="Max results"),
    offset: int = Query(0, description="Offset"),
    db: Session = Depends(get_db)
):
    """Get detailed AI usage logs"""
    try:
        query = db.query(AIUsageLog)

        filters = []
        if user_id is not None:
            filters.append(AIUsageLog.user_id == user_id)
        if start_time is not None:
            filters.append(AIUsageLog.created_at >= start_time)
        if end_time is not None:
            filters.append(AIUsageLog.created_at <= end_time)

        if filters:
            query = query.filter(and_(*filters))

        total = query.count()
        logs = query.order_by(AIUsageLog.created_at.desc()).offset(offset).limit(limit).all()

        return {
            "success": True,
            "total": total,
            "details": [
                {
                    "id": log.id,
                    "user_id": log.user_id,
                    "project_id": log.project_id,
                    "action": log.action,
                    "provider": log.provider,
                    "model": log.model,
                    "input_tokens": log.input_tokens,
                    "output_tokens": log.output_tokens,
                    "total_tokens": log.total_tokens,
                    "success": log.success,
                    "error_message": log.error_message,
                    "duration_ms": log.duration_ms,
                    "created_at": log.created_at,
                }
                for log in logs
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get usage details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/usage/by-model")
async def get_usage_by_model(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    start_time: Optional[float] = Query(None, description="Start timestamp"),
    end_time: Optional[float] = Query(None, description="End timestamp"),
    db: Session = Depends(get_db)
):
    """Get AI usage grouped by provider/model"""
    try:
        query = db.query(
            AIUsageLog.provider,
            AIUsageLog.model,
            func.count(AIUsageLog.id).label("call_count"),
            func.sum(AIUsageLog.total_tokens).label("total_tokens"),
            func.avg(AIUsageLog.duration_ms).label("avg_duration_ms"),
        ).group_by(AIUsageLog.provider, AIUsageLog.model)

        filters = []
        if user_id is not None:
            filters.append(AIUsageLog.user_id == user_id)
        if start_time is not None:
            filters.append(AIUsageLog.created_at >= start_time)
        if end_time is not None:
            filters.append(AIUsageLog.created_at <= end_time)

        if filters:
            query = query.filter(and_(*filters))

        results = query.all()

        return {
            "success": True,
            "by_model": [
                {
                    "provider": r.provider,
                    "model": r.model,
                    "call_count": r.call_count,
                    "total_tokens": r.total_tokens or 0,
                    "avg_duration_ms": round(r.avg_duration_ms or 0, 1),
                }
                for r in results
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get usage by model: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/usage/by-action")
async def get_usage_by_action(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    start_time: Optional[float] = Query(None, description="Start timestamp"),
    end_time: Optional[float] = Query(None, description="End timestamp"),
    db: Session = Depends(get_db)
):
    """Get AI usage grouped by action type"""
    try:
        query = db.query(
            AIUsageLog.action,
            func.count(AIUsageLog.id).label("call_count"),
            func.sum(AIUsageLog.total_tokens).label("total_tokens"),
        ).group_by(AIUsageLog.action)

        filters = []
        if user_id is not None:
            filters.append(AIUsageLog.user_id == user_id)
        if start_time is not None:
            filters.append(AIUsageLog.created_at >= start_time)
        if end_time is not None:
            filters.append(AIUsageLog.created_at <= end_time)

        if filters:
            query = query.filter(and_(*filters))

        results = query.all()

        return {
            "success": True,
            "by_action": [
                {
                    "action": r.action,
                    "call_count": r.call_count,
                    "total_tokens": r.total_tokens or 0,
                }
                for r in results
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get usage by action: {e}")
        raise HTTPException(status_code=500, detail=str(e))
