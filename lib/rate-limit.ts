import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { NextRequest, NextResponse } from "next/server";

const limiters = {
  register: new RateLimiterMemory({ points: 5,   duration: 60 }),
  checkin:  new RateLimiterMemory({ points: 60,  duration: 60 }),
  admin:    new RateLimiterMemory({ points: 120, duration: 60 }),
  public:   new RateLimiterMemory({ points: 60,  duration: 60 }),
};

export const registerLimiter = limiters.register;
export const checkinLimiter  = limiters.checkin;
export const adminLimiter    = limiters.admin;
export const publicLimiter   = limiters.public;

type LimiterKey = keyof typeof limiters;

function getIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1"
  );
}

export async function rateLimit(
  request: NextRequest,
  limiter: LimiterKey = "public"
): Promise<NextResponse | null> {
  const ip = getIp(request);
  try {
    await limiters[limiter].consume(ip);
    return null;
  } catch (err) {
    if (err instanceof RateLimiterRes) {
      return NextResponse.json(
        { error: "Too many requests. Please try again shortly." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(err.msBeforeNext / 1000)) } }
      );
    }
    throw err;
  }
}
