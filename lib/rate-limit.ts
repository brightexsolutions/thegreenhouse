import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import { NextRequest, NextResponse } from "next/server";

const limiters = {
  // Limits are per IP, and a whole venue on one Wi-Fi network is one IP.
  // Anything attendees do together in the room needs room for all of them.
  register: new RateLimiterMemory({ points: 20,  duration: 60 }),
  // Every volunteer phone at the door shares the venue Wi-Fi, so they share
  // one IP. 60 a minute across all of them ran out during a busy arrival.
  checkin:  new RateLimiterMemory({ points: 600, duration: 60 }),
  admin:    new RateLimiterMemory({ points: 120, duration: 60 }),
  public:   new RateLimiterMemory({ points: 60,  duration: 60 }),
  // Trivia answers, live feedback and photo shares: everyone taps at once.
  live:     new RateLimiterMemory({ points: 900, duration: 60 }),
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
