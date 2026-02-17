// refresh token rotation components

/**
 * @openapi
 * components:
 *   schemas:
 *     RefreshResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: token created successfully
 *         data:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */

//single logout
/**
 * @openapi
 * components:
 *   schemas:
 *     SuccessResponseEmpty:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Logout successfully
 *         data:
 *           type: object
 *           example: {}
 */
