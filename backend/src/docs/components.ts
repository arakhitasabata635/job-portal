/**
 * @openapi
 * components:
 *  schemas:
 *    resisterInput:
 *      type: object
 *      required:
 *        -name
 *        -email
 *        -password
 *        -phoneNumber
 *        -role
 *      properties:
 *        name:
 *          type: string
 *          minLength: 3
 *          example: Arakhita
 *        email:
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
 *    User:
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
 *     successResponseUser:
 *      type:object
 *      properties:
 *        message:
 *          type: string
 *        success:
 *          type:boolean
 *          example: true
 *        data:
 *    ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 */
