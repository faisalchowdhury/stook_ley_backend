import { Request, Response } from "express";

import catchAsync from "../../utils/catchAsync";
import sendError from "../../utils/sendError";
import sendResponse from "../../utils/sendResponse";

import { UserService } from "./user.service";

import { OTPModel, UserModel } from "./user.model";
import { PartnerModel } from "../partner/partner.model";
import { ChildrenModel } from "../children/children.model";

import { emitNotification } from "../../utils/socket";
import httpStatus from "http-status";
// import RegisterShowerModel from "../RegisterShower/RegisterShower.model";

import argon2 from "argon2";

import {
  findUserByEmail,
  findUserById,
  generateOTP,
  hashPassword,
  saveOTP,
  sendOTPEmailRegister,
  sendOTPEmailVerification,
} from "./user.utils";

import ApiError from "../../errors/ApiError";
import {
  generateRegisterToken,
  generateToken,
  generateTokenForAdmin,
  verifyToken,
} from "../../utils/JwtToken";

import { sendPushNotification } from "../notifications/pushNotification/pushNotification.controller";
import { IUserPayload } from "../../middlewares/roleGuard";

import { JwtPayloadWithUser } from "../../middlewares/userVerification";

import mongoose from "mongoose";

//  register User

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, role, type, fcmToken } = req.body;

    // Validate password based on role
    const userRole = role || "user";

    // Account type: "apple" or "default" (defaults to "default").
    // Apple accounts are auto-verified — no email verification needed.
    const accountType = type === "apple" ? "apple" : "default";

    // --- Role-Based Uniqueness Constraint ---
    // 1. Check for exact match (same email + same role)
    const existingExactUser = await UserModel.findOne({
      email,
      role: userRole,
    });
    if (existingExactUser) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message:
          "Registration failed. Please check your details and try again.",
        data: null,
      });
    }

    // 2. Cross-role constraint: authorizer vs executor
    // If trying to register as executor, check if already an authorizer (and vice versa)
    if (userRole === "executor" || userRole === "authorizer") {
      const otherRole = userRole === "executor" ? "authorizer" : "executor";
      const existingOtherRole = await UserModel.findOne({
        email,
        role: otherRole,
      });
      if (existingOtherRole) {
        return res.status(400).json({
          success: false,
          statusCode: 400,
          message:
            "Registration failed. Please check your details and try again.",
          data: null,
        });
      }
    }

    if (
      accountType !== "apple" &&
      (userRole === "authorizer" || userRole === "executor") &&
      !password
    ) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Password is required for authorizer and executor roles",
        data: null,
      });
    }

    const userPayload: any = {
      name,
      phone,
      email,
      role: userRole,
      type: accountType,
      isVerified: accountType === "apple", // Apple accounts are verified automatically
      password: null, // Default to null
      ...(fcmToken && { fcmToken }),
    };

    // Only hash and save password for authorizer and executor roles.
    // Apple accounts never store a password.
    if (
      accountType !== "apple" &&
      (userRole === "authorizer" || userRole === "executor") &&
      password
    ) {
      const hashedPassword = await hashPassword(password);
      userPayload.password = hashedPassword;
    }

    // Create new user
    const newUser = await UserModel.create(userPayload);

    // Generate, store and SEND OTP — skipped for apple accounts (already verified)
    if (accountType !== "apple") {
      const otp = generateOTP();
      await saveOTP(email, otp);
      await sendOTPEmailRegister(name, email, otp);
    }

    const token = generateToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    });

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: "User registered successfully. Please verify your email.",
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: error.message || "Registration failed",
      data: null,
    });
  }
};

const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const email = req.body.email;

  const isExist: any = await UserModel.findOne({ email });
  if (!isExist) {
    sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "User not found",
      data: null,
    });
  }

  const otp = generateOTP();
  await sendOTPEmailRegister(isExist.firstName, email, String(otp));
  // await UserService.sendPhoneVerification(email, otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 1000);
  // Save or update the OTP in the database concurrently.
  const isExistOtp = await Promise.all([
    OTPModel.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true }),
  ]);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Otp sent to this email ${email}`,
    data: "",
  });
});

export const loginUser = catchAsync(async (req: Request, res: Response) => {
  const { email, password, role, fcmToken } = req.body;

  const query: any = { email };
  if (role) {
    query.role = role;
  } else {
    query.role = { $in: ["admin", "authorizer", "executor"] };
  }

  const user: any = await UserModel.findOne(query);
  console.log(user);
  if (!user || user.isDeleted) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const userId = user._id as string;

  // Update FCM token on login (if provided).
  if (fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }

  // Apple accounts: passwordless login by email only (no password, no OTP).
  if (user.type === "apple") {
    const token = generateToken({
      id: userId,
      email: user.email,
      role: user.role,
    });
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Login complete!",
      data: {
        user: {
          _id: user._id,
          name: user?.name,
          email: user?.email,
          role: user?.role,
          fcmToken: user?.fcmToken,
        },
        token,
      },
    });
  }

  const verifyToken = generateToken({
    id: userId,
    email: user.email,
    role: user.role,
  });
  if (!user.isVerified) {
    const name = user.name as string;
    const otp = generateOTP();
    sendOTPEmailVerification(name, email, otp).catch((err) => {
      console.error("Error sending OTP email:", err);
    });
    await saveOTP(email, otp);
    return sendResponse(res, {
      statusCode: 401,
      success: false,
      message: "Please verify your email. An OTP has been sent.",
      data: {
        token: verifyToken,
      },
    });
  }

  // If user role is 'user', they should use OTP login
  if (user.role === "user" && !user.password) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await argon2.verify(
    user.password as string,
    password,
  );
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const token = generateToken({
    id: userId,
    email: user.email,
    role: user.role,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login complete!",
    data: {
      user: {
        _id: user._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
      },
      token,
    },
  });

  await user.save();
});

// Passwordless Login for User
export const userLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, fcmToken } = req.body;
  if (!email) {
    throw new ApiError(400, "Please provide your email.");
  }

  // Specifically look for 'user' role for passwordless login
  const user = await UserModel.findOne({ email, role: "user" });

  // Update FCM token on login (if provided).
  if (user && !user.isDeleted && fcmToken) {
    user.fcmToken = fcmToken;
    await user.save();
  }

  // Apple accounts: log in directly with login info, no OTP verification.
  if (user && !user.isDeleted && user.type === "apple") {
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Login successful",
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  }

  // Always return the same response to prevent account enumeration
  if (user && !user.isDeleted) {
    const otp = generateOTP();
    await sendOTPEmailRegister(user.name, email, otp);
    await saveOTP(email, otp);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "If this email is registered, an OTP has been sent.",
    data: null,
  });
});

export const verifyUserOTP = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const dbOTP = await OTPModel.findOne({ email });
  if (!dbOTP || dbOTP.otp !== otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
  }

  // Specifically look for 'user' role
  const user = await UserModel.findOne({ email, role: "user" });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Mark as verified if not already
  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  const token = generateToken({
    id: user._id,
    role: user.role,
    email: user.email,
  });

  // Delete OTP after successful verification
  await OTPModel.deleteOne({ email });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Login successful",
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

// //cool down timer
export const forgotPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Please provide your email.");
    }

    const user = await UserModel.findOne({ email });

    // Always return the same response to prevent account enumeration
    const token = generateRegisterToken({ email });

    if (user && !user.isDeleted) {
      const otp = generateOTP();
      await sendOTPEmailRegister(user.name, email, otp);
      await saveOTP(email, otp);
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "If this email is registered, an OTP has been sent.",
      data: { token },
    });
  },
);

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  let decoded: any;
  try {
    decoded = verifyToken(req.headers.authorization);
  } catch (error: any) {
    return sendError(res, error);
  }

  const email = decoded.email as string;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Please provide password.");
  }

  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "Password reset failed.");
  }

  const newPassword = await hashPassword(password);
  user.password = newPassword;
  await user.save();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully.",
    data: null,
  });
});

export const verifyOTP = catchAsync(async (req: Request, res: Response) => {
  const { otp } = req.body;
  try {
    const { token, name, email } = await UserService.verifyOTPService(
      otp,
      req.headers.authorization as string,
    );

    const user = (await UserModel.findOne({ email })) as any;
    // Mark user as verified, if needed
    if (!user.isVerified) {
      user.isVerified = true;
      await user.save();
    }
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "OTP Verified successfully.",
      data: { name, token, role: user.role },
    });
  } catch (error: any) {
    throw new ApiError(500, error.message || "Failed to verify otp");
  }
});

// User Id
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { name, phone, address } = req.body;
  const decoded = req.user as IUserPayload;
  const userId = decoded.id;

  const updateData: any = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (address) updateData.address = address;

  if (req.file) {
    updateData.profilePicture = `/images/${req.file.filename}`;
  }

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

export const getSelfInfo = catchAsync(async (req: Request, res: Response) => {
  try {
    const decoded = req.user as IUserPayload;
    const userId = decoded.id as string;

    // Find the user in DB with deathReport.reportedBy populated
    const user = await UserModel.findById(userId).populate(
      "deathReport.reportedBy",
      "name email profilePicture",
    );
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    const userData = user.toObject();

    // Fetch Partner and Children data
    const [partner, children] = await Promise.all([
      PartnerModel.findOne({ userId, isDeleted: false }),
      ChildrenModel.find({ userId, isDeleted: false }),
    ]);

    // Prepare response data
    const responseData: any = {
      _id: userData._id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      address: userData.address,
      profilePicture: userData.profilePicture || null,
      role: userData.role,
      isDeath: userData.isDeath,
      deathReport: userData.deathReport,
      partner: partner || null,
      children: children || [],
    };

    // Send final response
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile information retrieved successfully",
      data: responseData,
    });
  } catch (error: any) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Unexpected error occurred while retrieving profile.",
    );
  }
});

export const uploadProfilePicture = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as JwtPayloadWithUser;
    const userId = user.id;
    const payload: any = {};
    if (req.file) {
      payload.profilePicture = `/image/${req.file.filename}`;
    }

    const uploadImage = await UserModel.findOneAndUpdate(
      { _id: userId },
      payload,
    ).select("-password");

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Image uploaded successfully",
      data: uploadImage,
    });
  },
);

// delete user
export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const id = req.query?.id as string;
    const deleteableuser = await findUserById(id);
    if (!deleteableuser) {
      throw new ApiError(404, "User not found.");
    }
    if (deleteableuser.isDeleted) {
      throw new ApiError(404, "This account is already deleted.");
    }
    if ((req.user as IUserPayload)?.id !== id) {
      throw new ApiError(
        403,
        "You cannot delete this account. Please contact support",
      );
    }

    await UserService.userDelete(id, deleteableuser.email);
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Account deleted successfully",
      data: null,
    });
  } catch (error: any) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Unexpected error occurred while deleting the user.",
    );
  }
});

export const changePassword = catchAsync(
  async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        throw new Error("Please provide both old password and new password.");
      }

      const decoded = req.user as IUserPayload;
      const email = decoded.email as string;
      const user = await findUserByEmail(email);

      if (!user) {
        throw new Error("User not found.");
      }

      const isMatch = await argon2.verify(user.password as string, oldPassword);
      if (!isMatch) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Old password is incorrect.",
        );
      }

      const hashedNewPassword = await argon2.hash(newPassword);
      user.password = hashedNewPassword;
      await user.save();

      sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "You have successfully changed your password.",
        data: null,
      });
    } catch (error: any) {
      throw new ApiError(
        error.statusCode || 500,
        error.message || "Failed to change password.",
      );
    }
  },
);

const adminloginUser = catchAsync(async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email, role: "admin" });
    if (!user) {
      throw new ApiError(401, "Invalid email or password.");
    }

    // Check password validity
    const isPasswordValid = await argon2.verify(
      user.password as string,
      password,
    );
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password.");
    }

    const userId = user._id as string;

    // Generate new token for the logged-in user
    const token = generateTokenForAdmin({
      id: userId,
      email: user.email,
      role: user.role,
    });

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Login complete!",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error: any) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "An error occurred during admin login.",
    );
  }
});

//admin dashboard----------------------------------------------------------------------------------------

// add device id

const addDeviceId = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as JwtPayloadWithUser;
  const { deviceId } = req.body;
  await UserModel.findByIdAndUpdate(
    user.id,
    { deviceId: deviceId },
    { new: true },
  );
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Device ID added successfully",
    data: null,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  let decoded;
  try {
    decoded = verifyToken(req.headers.authorization);
  } catch (error: any) {
    return sendError(res, error); // If token verification fails, send error response.
  }

  const adminId = decoded.id as string;

  // Verify if admin exists
  const user = await findUserById(adminId);
  if (!user) {
    throw new ApiError(404, "This admin account does not exist.");
  }

  // Pagination and filters
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { date, name, email, role, requestStatus } = req.query;

  try {
    // Get the user list based on pagination and filters
    const { users, pagination } = await UserService.getUserList(
      skip,
      limit,
      date as string,
      name as string,
      email as string,
      role as string,
      requestStatus as string,
    );

    if (users.length === 0) {
      return sendResponse(res, {
        statusCode: httpStatus.NO_CONTENT,
        success: true,
        message: "No user found based on your search.",
        data: [],
        pagination: {
          ...pagination,
          prevPage: pagination.prevPage ?? 0,
          nextPage: pagination.nextPage ?? 0,
        },
      });
    }

    // Populate manager info for each user
    const usersWithManagerInfo = await UserModel.populate(users, {
      path: "managerInfoId",
      select: "type businessAddress websiteLink governMentImage.publicFileURL",
    });

    // Format response data
    const responseData = usersWithManagerInfo.map((user: any) => ({
      _id: user._id,
      image: user.image?.publicFileURL,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      //isRequest: user.isRequest,
      managerInfo: user.managerInfoId
        ? {
            type: user.managerInfoId.type,
            businessAddress: user.managerInfoId.businessAddress,
            websiteLink: user.managerInfoId.websiteLink,
            governMentImage: user.managerInfoId.governMentImage?.publicFileURL,
            isRequest: user.isRequest,
          }
        : null,
      createdAt: user.createdAt,
    }));

    // Send response with pagination details
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User list retrieved successfully",
      data: responseData,
      pagination: {
        ...pagination,
        prevPage: pagination.prevPage ?? 0,
        nextPage: pagination.nextPage ?? 0,
      },
    });
  } catch (error: any) {
    // Handle any errors during the user fetching or manager population
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to retrieve users.",
    );
  }
});

// make admin delete

// update admin information

const updateAdminInformation = async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayloadWithUser;
    const { name, email, phone } = req.body;

    const userPayload: { name: any; email: any; phone: any; image?: string } = {
      name,
      email,
      phone,
    };

    if (req.file) {
      userPayload.image = `/images/${req.file.filename}`;
    }

    const updateAdmin = await UserModel.findByIdAndUpdate(
      { _id: user.id },
      userPayload,
      { new: true },
    );

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Admin data updated successfully",
      data: updateAdmin,
    });
  } catch (err) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Something went wrong",
      data: null,
    });
  }
};

// update admin password

// const updateAdminPassword = async (req: Request, res: Response) => {
//   const user = req.user as JwtPayloadWithUser;
//   const userId = user.id;

//   const findadmin = await UserModel.findById(userId);
//   const { oldPassword, newPassword, confirmPassword } = req.body;

//   const isPasswordValid = await argon2.verify(
//     findadmin.password as string,
//     oldPassword
//   );

//   if (!isPasswordValid) {
//     return sendResponse(res, {
//       statusCode: 404,
//       success: false,
//       message: "Old password not matched",
//       data: null,
//     });
//   }

//   if (newPassword !== confirmPassword) {
//     return sendResponse(res, {
//       statusCode: 404,
//       success: false,
//       message: "password and confirm password are not matched",
//       data: null,
//     });
//   }

//   const hashedPassword = await hashPassword(newPassword);

//   const updatePass = await UserModel.findByIdAndUpdate(
//     { _id: userId },
//     { password: hashedPassword },
//     { new: true }
//   );

//   return sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "password updated successfully",
//     data: null,
//   });
// };

const getAdminInfo = async (req: Request, res: Response) => {
  res.status(200).json({ user: req.user });
};

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    // Get query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Get optional search filter
    const search = (req.query.search as string) || "";

    // Build search condition
    const searchCondition = {
      role: "customer",
      ...(search
        ? {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { email: { $regex: search, $options: "i" } },
              { phone: { $regex: search, $options: "i" } },
            ],
          }
        : {}),
    };

    // Get total count
    const totalCustomers = await UserModel.countDocuments(searchCondition);

    // Fetch paginated data
    const allCustomers = await UserModel.find(searchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination info
    const totalPage = Math.ceil(totalCustomers / limit);
    const pagination = {
      totalPage,
      currentPage: page,
      prevPage: page > 1 ? page - 1 : null,
      nextPage: page < totalPage ? page + 1 : null,
      totalData: totalCustomers,
    };

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      data: allCustomers,
      pagination,
    });

    // return sendResponse(res, {
    //   statusCode: 200,
    //   success: true,
    //   message: "Customers fetched successfully",
    //   data: allCustomers,
    //   pagination,
    // });
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: "Failed to fetch customers",
      data: error.message,
    });
  }
};

export const searchSubadmin = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Case-insensitive search using regex
    const users = await UserModel.find({
      $or: [
        { email: { $regex: search, $options: "i" }, role: "subadmin" },
        { name: { $regex: search, $options: "i" }, role: "subadmin" },
      ],
    }).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

const getAllSubadmin = async (req: Request, res: Response) => {
  const allSubadmins = await UserModel.find({ role: "subadmin" });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Customer fetched successfully",
    data: allSubadmins,
  });
};

const updateUserStatus = async (req: Request, res: Response) => {
  const userId = req.params.userId;
  const status = req.params.status;

  const findUser = await UserModel.findById(userId);

  if (!["active", "blocked"].includes(status)) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Status is not valid",
      data: null,
    });
  }

  const findBarber = await UserModel.findById(userId);

  if (!findBarber) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not registered",
      data: null,
    });
  }

  const updateUserStatus = await UserModel.findByIdAndUpdate(
    { _id: userId },
    { status },
    { new: true },
  );

  // send Notification
  // // --------> Emit notification <----------------
  // Convert the created user's id to a mongoose ObjectId type.
  const user: any = findUser;
  // Create a payload for notifications with messages for both the user and the admin.
  const notificationPayload: any = {
    userId: user?._id,
    userMsgTittle: "User Status updated successfully",
    adminMsgTittle: `Profile status updated to ${status}`,
    userMsg: `Your profile status have been updated to ${status}`,
    adminMsg: `${user.name} satatus successfully changed to ${status}`,
  };

  // Emit the notification.
  await emitNotification(notificationPayload);
  // --------> End Emit notification <----------------
  // --------> Send push notification via FCM (if fcmToken is provided) <----------------
  if (user.fcmToken) {
    try {
      // Define the base push message.
      const pushMessage = {
        title: `Your status have been changed to ${status}`,
        body: `Your status have been changed to ${status}`,
      };

      // Send the push notification.
      await sendPushNotification(user.fcmToken, pushMessage);
    } catch (pushError) {
      // Log any push notification errors without affecting the client response.
      console.error("Error sending push notification:", pushError);
    }
  }
  // send notification
  // --------> End push notification <----------------
  return sendResponse(res, {
    statusCode: 200,
    success: false,
    message: "Barber status updated successfully",
    data: updateUserStatus,
  });
};

// get admin profile

const getAdminProfile = async (req: Request, res: Response) => {
  const getAdmin = await UserModel.findOne({ role: "admin" });

  return sendResponse(res, {
    statusCode: 200,
    success: false,
    message: "Admin found successfully",
    data: getAdmin,
  });
};

export const searchCustomer = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    if (!search || typeof search !== "string") {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Case-insensitive search using regex
    const users = await UserModel.find({
      $or: [
        { email: { $regex: search, $options: "i" }, role: "customer" },
        { name: { $regex: search, $options: "i" }, role: "customer" },
      ],
    }).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// reset admin password

export const resetAdminPassword = catchAsync(
  async (req: Request, res: Response) => {
    const { phone, otp, password } = req.body;

    if (!phone) throw new ApiError(400, "Phone number is required.");
    if (!otp) throw new ApiError(400, "OTP is required.");
    if (!password) throw new ApiError(400, "Password is required.");

    // 1️⃣ Verify OTP
    const otpRecord = await OTPModel.findOne({ phone, otp });
    if (!otpRecord) {
      throw new ApiError(400, "Invalid or expired OTP.");
    }

    // Optional: check if OTP is expired
    const now = new Date();
    if (otpRecord.expiresAt && otpRecord.expiresAt < now) {
      throw new ApiError(400, "OTP has expired.");
    }

    // 2️⃣ Find user
    const user = await UserModel.findOne({ phone });
    if (!user) {
      throw new ApiError(404, "User not found.");
    }

    // 3️⃣ Hash and update password
    user.password = await hashPassword(password);

    // Mark as verified if needed
    if (!user.isVerified) user.isVerified = true;

    await user.save();

    // 4️⃣ Delete OTP after successful reset
    await OTPModel.deleteOne({ _id: otpRecord._id });

    // 5️⃣ Send response
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password reset successfully.",
      data: {
        email: user.email,
        name: user.name,
      },
    });
  },
);

// count total customer

export const dashboardStats = async (req: Request, res: Response) => {
  try {
    const totalCustomer = await UserModel.find({
      role: "customer",
    }).countDocuments();
    const totalBarber = await UserModel.find({
      role: "barber",
    }).countDocuments();

    const dashboardStats = {
      totalCustomer,
      totalBarber,
    };

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Total customer retrived successfully",
      data: dashboardStats,
    });
  } catch (err) {
    console.log(err);
  }
};

export const getProfileInfo = async (req: Request, res: Response) => {
  const user = req.user as JwtPayloadWithUser;
  const userId = user.id;

  if (user.role === "customer") {
    const getCustomerInfo = await UserModel.findOne({ _id: userId });

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User information retrieved successfully",
      data: getCustomerInfo,
    });
  } else if (user.role === "barber") {
    const getBarberInfo = await UserModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "barbers",
          localField: "_id",
          foreignField: "userId",
          as: "barberInfo",
        },
      },
      { $unwind: { path: "$barberInfo", preserveNullAndEmptyArrays: true } },

      // Merge both documents (barber first so it overwrites user fields)
      {
        $replaceRoot: {
          newRoot: { $mergeObjects: ["$barberInfo", "$$ROOT"] },
        },
      },

      {
        $addFields: {
          barberId: "$barberInfo._id",
          userId: "$barberInfo.userId",
        },
      },

      // Remove unnecessary fields
      {
        $project: {
          _id: 0,
          barberInfo: 0,
          password: 0,
          __v: 0,
        },
      },
    ]);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User information retrieved successfully",
      data: getBarberInfo[0],
    });
  }
};

// export const deviceLoginUser = catchAsync(
//   async (req: Request, res: Response) => {
//     const { deviceId, fcmToken } = req.body;
//     const user = await UserModel.findOne({ deviceId });
//     if (!user) {
//       throw new ApiError(401, "This account does not exist.");
//     }
//     const userId = user._id as string;

//     // If user is not verified, send OTP and return a verification token
//     const verifyToken = generateToken({
//       id: userId,
//       phone: user.phone,
//       role: user.role,
//       isLogin: user.isLogin,
//     });

//     // if (!user.isVerified) {
//     //   const name = user.name as string;
//     //   const otp = generateOTP();
//     //   // Fire-and-forget email/phone OTP send, but persist OTP
//     //   sendOTPEmailVerification(name, user.phone, otp).catch((err) =>
//     //     console.error("Error sending OTP email:", err)
//     //   );
//     //   await saveOTP(user.phone, otp);

//     //   return sendResponse(res, {
//     //     statusCode: 401,
//     //     success: false,
//     //     message: "We've sent an OTP to your phone to verify your profile.",
//     //     data: {
//     //       role: user.role,
//     //       token: verifyToken,
//     //     },
//     //   });
//     // }

//     // Mark user as logged in
//     const updateLogin = await UserModel.findByIdAndUpdate(
//       user._id,
//       { isLogin: true },
//       { new: true, upsert: true }
//     );

//     const token = generateToken({
//       id: userId,
//       phone: user.phone,
//       role: user.role,
//       isLogin: updateLogin.isLogin,
//     });

//     // Update fcmToken if provided
//     if (fcmToken) {
//       user.fcmToken = fcmToken;
//       await user.save();
//     }

//     return sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: "Login complete!",
//       data: {
//         user: {
//           _id: user._id,
//           name: user?.name,
//           email: user?.email,
//           phone: user?.phone,
//           image: user?.image || "",
//           role: user?.role,
//           isLogin: updateLogin.isLogin,
//         },
//         token,
//       },
//     });
//   }
// );
const reportDeath = catchAsync(async (req: Request, res: Response) => {
  const reporter = req.user as IUserPayload;
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User ID is required");
  }

  const result = await UserService.reportDeath(reporter.id, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message:
      "Death report submitted successfully. User has 24 hours to respond.",
    data: result,
  });
});

const respondToDeathReport = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserPayload;
  const { isAlive } = req.body;

  if (isAlive === undefined) {
    throw new ApiError(httpStatus.BAD_REQUEST, "isAlive status is required");
  }

  const result = await UserService.respondToDeathReport(user.id, isAlive);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: isAlive
      ? "Death report declined successfully."
      : "Death confirmed.",
    data: result,
  });
});

const UserController = {
  registerUser,
  resendOTP,
  verifyOTP,
  userLogin,
  verifyUserOTP,
  updateUser,
  getSelfInfo,
  deleteUser,
  changePassword,
  adminloginUser,
  getAllUsers,
  reportDeath,
  respondToDeathReport,
};

export { UserController };
