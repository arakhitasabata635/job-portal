// refresh token rotation api
/**
 * @openapi
 * /session/refresh:
 *   post:
 *     tags:
 *       - Session
 *     summary: Refresh access token
 *     description: Generates a new access token and refresh token using a valid HttpOnly refresh token cookie.
 *     security:
 *       - refreshCookie: []
 *     responses:
 *       200:
 *         description: Token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: Invalid, expired or reused refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// single logout api
/**
 * @openapi
 * /session/logout:
 *   post:
 *     tags:
 *       - Session
 *     summary: Logout current session
 *     description: Logs out the current device by deleting the session and clearing the refresh token cookie.
 *     responses:
 *       200:
 *         description: Logout successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseEmpty'
 *       401:
 *         description: Invalid or missing refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

//all session logout

/**
 * @openapi
 * /session/logout-all:
 *   post:
 *     tags:
 *       - Session
 *     summary: Logout from all devices
 *     description: Deletes all active sessions for the authenticated user and clears the refresh token cookie.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out from all devices
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponseEmpty'
 *       401:
 *         description: Unauthorized or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

export {};
