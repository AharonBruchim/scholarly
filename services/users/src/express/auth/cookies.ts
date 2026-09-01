import type { CookieOptions, Request, Response } from 'express';

const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

export const refreshCookieName = isProduction ? '__Host-scholarly_refresh' : 'scholarly_refresh';

const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
};

export const getRefreshCookie = (req: Request): string | undefined => {
    const value = req.cookies?.[refreshCookieName];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};

export const setRefreshCookie = (res: Response, refreshToken: string): void => {
    res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);
};

export const clearRefreshCookie = (res: Response): void => {
    const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions;
    res.clearCookie(refreshCookieName, clearOptions);
};
