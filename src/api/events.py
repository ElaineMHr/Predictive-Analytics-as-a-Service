import json
import os
import time
from typing import AsyncGenerator
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

try:
    from config import settings
except ImportError:
    from src.config import settings

router = APIRouter()

REDIS_URL = settings.REDISSERVER
CHANNEL = "jobs:global"

def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

@router.get("/stream")
async def stream_events(request: Request) -> StreamingResponse:
    if settings.is_portfolio:
        async def noop_stream() -> AsyncGenerator[str, None]:
            yield sse("info", {
                "message": "SSE not available in portfolio mode. Use GET /jobs/{job_id}/status for polling.",
                "ts": time.time(),
            })
        return StreamingResponse(noop_stream(), media_type="text/event-stream")

    import redis.asyncio as redis_async

    async def event_generator() -> AsyncGenerator[str, None]:
        redis_con = redis_async.from_url(REDIS_URL, decode_responses=True)
        pubsub = redis_con.pubsub()
        await pubsub.subscribe(CHANNEL)

        try:
            yield sse("connected", {"ts": time.time(), "channel": CHANNEL})

            while True:
                if await request.is_disconnected():
                    break

                msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)

                if msg and msg.get("type") == "message":
                    payload = json.loads(msg["data"])
                    event = payload.get("event", "job.event")
                    yield sse(event, payload)

        finally:
            await pubsub.unsubscribe(CHANNEL)
            await pubsub.close()
            await redis_con.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")
