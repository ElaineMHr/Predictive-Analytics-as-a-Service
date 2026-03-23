import json
import os
import time
from typing import AsyncGenerator
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import redis.asyncio as redis

router = APIRouter()

REDIS_URL = os.getenv("REDISSERVER", "redis://redis_server:6379")
CHANNEL = "jobs:global" # f"jobs:user:{user_id}" to add later -> Channel per user

def sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"

@router.get("/stream")
async def stream_events(request: Request) -> StreamingResponse:
    async def event_generator() -> AsyncGenerator[str, None]: # str: each yield -> string, None: never .send() values to the generator
        redis_con = redis.from_url(REDIS_URL, decode_responses=True)
        pubsub = redis_con.pubsub()
        await pubsub.subscribe(CHANNEL)

        try:
            yield sse("connected", {"ts": time.time(), "channel": CHANNEL})
            
            while True:
                if await request.is_disconnected():
                    break
                
                # Every *timeout* seconds recheck if request.is_disconnected()
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


