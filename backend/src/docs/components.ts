//resister component

/**
 * @openapi
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - phoneNumber
 *         - role
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           example: Arakhita
 *         email:
 *           type: string
 *           format: email
 *           example: arakhita@gmail.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: Test@123
 *         phoneNumber:
 *           type: string
 *           pattern: "^[6-9]\\d{9}$"
 *           example: 9876543210
 *         role:
 *           type: string
 *           enum: [jobseeker, recruiter]
 *
 *     User:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         isEmailVerify:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     SuccessResponseUser:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/User'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 */

//login component

/**
 * @openapi
 * components:
 *   schemas:
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: arakhita@gmail.com
 *         password:
 *           type: string
 *           example: Test@123
 *
 *     LoginResponseData:
 *       type: object
 *       properties:
 *         userDTO:
 *           $ref: '#/components/schemas/User'
 *         accessToken:
 *           type: string
 *
 *     SuccessResponseLogin:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/LoginResponseData'
 */

//ForgotPassword components

/**
 * @openapi
 * components:
 *   schemas:
 *     ForgotPasswordInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: arakhita@gmail.com
 *
 *     SuccessResponseEmpty:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           example: {}
 */

// reset password component

/**
 * @openapi
 * components:
 *   schemas:
 *     ResetPasswordInput:
 *       type: object
 *       required:
 *         - token
 *         - password
 *       properties:
 *         token:
 *           type: string
 *           description: Raw reset token received in email
 *           example: 8f9c3a4b2e6d...
 *         password:
 *           type: string
 *           minLength: 6
 *           example: NewPass@123
 */

// email verification component
/**
 * @openapi
 * components:
 *   schemas:
 *     EmailVerifyInput:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           description: Raw verification token received in email
 *           example: 7d8a9c3b1e5f...
 */

//resend email verification
/**
 * @openapi
 * components:
 *   schemas:
 *     ResendEmailVerifyInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 */

export {}; // this tell that this file is a module file
