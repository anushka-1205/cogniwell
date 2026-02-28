import express from 'express'
import { register, login, isAuth, logout, updateDiseaseStatus } from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';

const userRouter = express.Router();

userRouter.post('/register', register);
userRouter.post('/login', login);
userRouter.get('/is-auth', authUser, isAuth);
userRouter.get('/logout', authUser, logout);
userRouter.put('/update-disease-status', authUser, updateDiseaseStatus);

export default userRouter;

