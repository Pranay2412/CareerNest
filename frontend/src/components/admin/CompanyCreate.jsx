import React, { useState } from 'react'
import Navbar from '../shared/Navbar'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { COMPANY_API_END_POINT } from '@/utils/constant'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { setSingleCompany } from '@/redux/companySlice'

const CompanyCreate = () => {
    const navigate = useNavigate();
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const registerNewCompany = async (e) => {
        e.preventDefault();
        if (!companyName.trim()) {
            toast.error("Company name is required.");
            return;
        }
        try {
            setLoading(true);
            const res = await axios.post(`${COMPANY_API_END_POINT}/register`, {companyName}, {
                headers:{
                    'Content-Type':'application/json'
                },
                withCredentials:true
            });
            if(res?.data?.success){
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message);
                const companyId = res?.data?.company?._id;
                navigate(`/admin/companies/${companyId}`);
            }
        } catch (error) {
            console.error("Company registration failed:", error);
            toast.error(error.response?.data?.message || error.message || "Unable to register the company.");
        } finally {
            setLoading(false);
        }
    }
    return (
        <div>
            <Navbar />
            <div className='max-w-4xl mx-auto'>
                <div className='my-10'>
                    <h1 className='font-bold text-2xl'>Your Company Name</h1>
                    <p className='text-muted-foreground'>What would you like to give your company name? you can change this later.</p>
                </div>

                <form onSubmit={registerNewCompany}>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                        id="company-name"
                        type="text"
                        className="my-2"
                        placeholder="JobHunt, Microsoft etc."
                        value={companyName}
                        required
                        onChange={(e) => setCompanyName(e.target.value)}
                    />
                    <div className='flex items-center gap-2 my-10'>
                        <Button type="button" variant="outline" onClick={() => navigate("/admin/companies")}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Continue"}</Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default CompanyCreate