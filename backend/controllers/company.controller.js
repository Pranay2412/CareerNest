import { Company } from "../models/company.model.js";
import { User } from "../models/user.model.js";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import { randomUUID } from "node:crypto";

export const registerCompany = async (req, res) => {
    try {
        const { companyName } = req.body;
        if (!companyName?.trim()) {
            return res.status(400).json({
                message: "Company name is required.",
                success: false
            });
        }
        const user = await User.findById(req.id).select("role");
        if (user?.role !== "recruiter") {
            return res.status(403).json({
                message: "Only recruiters can register a company.",
                success: false
            });
        }
        const normalizedCompanyName = companyName.trim();
        let company = await Company.findOne({ name: normalizedCompanyName });
        if (company) {
            return res.status(400).json({
                message: "You can't register same company.",
                success: false
            })
        };
        company = await Company.create({
            name: normalizedCompanyName,
            userId: req.id
        });

        return res.status(201).json({
            message: "Company registered successfully.",
            company,
            success: true
        })
    } catch (error) {
        console.error("Company registration failed:", error);
        return res.status(500).json({
            message: error.code === 11000 ? "A company with that name already exists." : "Unable to register the company.",
            success: false
        });
    }
}
export const getCompany = async (req, res) => {
    try {
        const userId = req.id; // logged in user id
        const companies = await Company.find({ userId });
        if (!companies) {
            return res.status(404).json({
                message: "Companies not found.",
                success: false
            })
        }
        return res.status(200).json({
            companies,
            success:true
        })
    } catch (error) {
        console.error("Company list request failed:", error);
        return res.status(500).json({ message: "Unable to load companies.", success: false });
    }
}
// get company by id
export const getCompanyById = async (req, res) => {
    try {
        const companyId = req.params.id;
        const company = await Company.findById(companyId);
        if (!company || String(company.userId) !== String(userId)) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            company,
            success: true
        })
    } catch (error) {
        console.error("Company lookup failed:", error);
        return res.status(500).json({ message: "Unable to load the company.", success: false });
    }
}
export const updateCompany = async (req, res) => {
    try {
        const { name, description, website, location } = req.body;
 
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (website !== undefined) updateData.website = website;
        if (location !== undefined) updateData.location = location;
        if (req.file) {
            if (!process.env.CLOUD_NAME || !process.env.API_KEY || !process.env.API_SECRET) {
                return res.status(503).json({
                    message: "Company logo uploads are unavailable because image storage is not configured.",
                    success: false
                });
            }
            const fileUri = getDataUri(req.file);
            const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
                public_id: randomUUID()
            });
            updateData.logo = cloudResponse.secure_url;
        }

        const existingCompany = await Company.findById(req.params.id);
        if (!existingCompany || String(existingCompany.userId) !== String(req.id)) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            });
        }

        const company = await Company.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (!company) {
            return res.status(404).json({
                message: "Company not found.",
                success: false
            })
        }
        return res.status(200).json({
            message:"Company information updated.",
            company,
            success:true
        })

    } catch (error) {
        console.error("Company update failed:", error);
        return res.status(500).json({
            message: error.code === 11000 ? "A company with that name already exists." : "Unable to update the company.",
            success: false
        });
    }
}