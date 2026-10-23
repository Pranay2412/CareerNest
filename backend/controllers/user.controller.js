import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RESUME_DIRECTORY = fileURLToPath(new URL("../uploads/resumes/", import.meta.url));
const MAX_RESUME_SIZE = 10 * 1024 * 1024;

const isLocalResume = (resume) => /^\/api\/v1\/user\/resume\/[a-f0-9-]+\.pdf$/i.test(resume || "");

const removeLocalResume = async (resume) => {
    if (!isLocalResume(resume)) return;
    try {
        await unlink(join(RESUME_DIRECTORY, basename(resume)));
    } catch (error) {
        if (error.code !== "ENOENT") {
            console.error("Failed to remove replaced resume:", error);
        }
    }
};

export const register = async (req, res) => {
    try {
        const { fullname, email, phoneNumber, password, role } = req.body;
         
        if (!fullname || !email || !phoneNumber || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({
                message: 'User already exist with this email.',
                success: false,
            })
        }

        let profilePhoto = "";
        let profilePhotoUploadFailed = false;
        if (req.file) {
            if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
                profilePhotoUploadFailed = true;
                console.warn("Profile photo upload skipped: Cloudinary credentials are not configured.");
            } else {
                try {
                    const fileUri = getDataUri(req.file);
                    const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
                    profilePhoto = cloudResponse.secure_url;
                } catch (error) {
                    profilePhotoUploadFailed = true;
                    console.error("Profile photo upload failed during signup:", error);
                }
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password: hashedPassword,
            role,
            profile:{
                profilePhoto,
            }
        });

        return res.status(201).json({
            message: profilePhotoUploadFailed
                ? "Account created successfully. Your profile photo was not saved because photo uploads are not configured."
                : "Account created successfully.",
            success: true
        });
    } catch (error) {
        console.error("Signup failed:", error);
        return res.status(500).json({
            message: "Unable to create your account. Please try again.",
            success: false
        });
    }
}
export const login = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Something is missing",
                success: false
            });
        };
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(400).json({
                message: "Incorrect email or password.",
                success: false,
            })
        };
        // check role is correct or not
        if (role !== user.role) {
            return res.status(400).json({
                message: "Account doesn't exist with current role.",
                success: false
            })
        };

        const tokenData = {
            userId: user._id
        }
        const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).cookie("token", token, { maxAge: 1 * 24 * 60 * 60 * 1000, httpsOnly: true, sameSite: 'strict' }).json({
            message: `Welcome back ${user.fullname}`,
            user,
            success: true
        })
    } catch (error) {
        console.error("Login failed:", error);
        return res.status(500).json({
            message: "Unable to log in right now. Please try again.",
            success: false
        });
    }
}
export const logout = async (req, res) => {
    try {
        return res.status(200).cookie("token", "", { maxAge: 0 }).json({
            message: "Logged out successfully.",
            success: true
        })
    } catch (error) {
        console.log(error);
    }
}
export const updateProfile = async (req, res) => {
    let uploadedResumePath;
    try {
        const { fullname, email, phoneNumber, bio, skills } = req.body;

        let resumePath;
        if (req.file) {
            const file = req.file;
            if (
                file.mimetype !== "application/pdf" ||
                extname(file.originalname).toLowerCase() !== ".pdf" ||
                file.size > MAX_RESUME_SIZE ||
                file.size < 5 ||
                file.buffer.subarray(0, 5).toString() !== "%PDF-"
            ) {
                return res.status(400).json({
                    message: "Upload a valid PDF resume smaller than 10 MB.",
                    success: false
                });
            }

            if (process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET) {
                const fileUri = getDataUri(file);
                const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                    resource_type: "raw",
                    public_id: `${randomUUID()}.pdf`
                });
                resumePath = cloudResponse.secure_url;
            } else {
                await mkdir(RESUME_DIRECTORY, { recursive: true });
                const filename = `${randomUUID()}.pdf`;
                uploadedResumePath = join(RESUME_DIRECTORY, filename);
                await writeFile(uploadedResumePath, file.buffer, { flag: "wx" });
                resumePath = `/api/v1/user/resume/${filename}`;
            }
        }

        const userId = req.id; // middleware authentication
        let user = await User.findById(userId);

        if (!user) {
            return res.status(400).json({
                message: "User not found.",
                success: false
            })
        }

        const previousResume = user.profile.resume;
        if (fullname !== undefined) user.fullname = fullname;
        if (email !== undefined) user.email = email;
        if (phoneNumber !== undefined && phoneNumber !== "") user.phoneNumber = phoneNumber;
        if (bio !== undefined) user.profile.bio = bio;
        if (skills !== undefined) {
            user.profile.skills = skills.split(",").map((skill) => skill.trim()).filter(Boolean);
        }
        if (resumePath) {
            user.profile.resume = resumePath;
            user.profile.resumeOriginalName = req.file.originalname;
        }

        await user.save();
        if (resumePath && previousResume !== resumePath) {
            await removeLocalResume(previousResume);
        }

        user = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            profile: user.profile
        }

        return res.status(200).json({
            message:"Profile updated successfully.",
            user,
            success:true
        })
    } catch (error) {
        if (uploadedResumePath) {
            try {
                await unlink(uploadedResumePath);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    console.error("Failed to clean up an unsaved resume:", cleanupError);
                }
            }
        }
        console.error("Profile update failed:", error);
        return res.status(500).json({
            message: error.code === 11000
                ? "An account with that email address already exists."
                : "Unable to update your profile. Please try again.",
            success: false
        });
    }
}

export const downloadResume = async (req, res) => {
    try {
        const { filename } = req.params;
        if (!/^[a-f0-9-]+\.pdf$/i.test(filename)) {
            return res.status(400).json({ message: "Invalid resume file.", success: false });
        }

        const user = await User.findById(req.id).select("profile.resume");
        const resumePath = `/api/v1/user/resume/${filename}`;
        if (!user || user.profile.resume !== resumePath) {
            return res.status(404).json({ message: "Resume not found.", success: false });
        }

        return res.download(join(RESUME_DIRECTORY, filename), "resume.pdf", (error) => {
            if (error && !res.headersSent) {
                console.error("Resume download failed:", error);
                res.status(error.code === "ENOENT" ? 404 : 500).json({
                    message: error.code === "ENOENT" ? "Resume not found." : "Unable to download the resume.",
                    success: false
                });
            }
        });
    } catch (error) {
        console.error("Resume download failed:", error);
        return res.status(500).json({ message: "Unable to download the resume.", success: false });
    }
}