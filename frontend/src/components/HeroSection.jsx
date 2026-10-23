import React, { useState } from 'react'
import { Button } from './ui/button'
import { Search } from 'lucide-react'
import { useDispatch } from 'react-redux';
import { setSearchedQuery } from '@/redux/jobSlice';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
    const [query, setQuery] = useState("");
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const searchJobHandler = () => {
        dispatch(setSearchedQuery(query));
        navigate("/browse");
    }

    return (
        <div className='text-center'>
            <div className='flex flex-col gap-5 my-10'>
                <span className='mx-auto px-4 py-2 rounded-full bg-secondary text-primary font-medium'>Find work that moves you forward</span>
                <h1 className='text-5xl font-bold'>Search, Apply & <br /> Get Your <span className='text-primary'>Dream Jobs</span></h1>
                <p className='text-muted-foreground'>Discover opportunities that match your skills, goals, and ambition.</p>
                <div className='flex w-[40%] shadow-lg bg-card border border-border pl-3 rounded-full items-center gap-4 mx-auto'>
                    <input
                        type="text"
                        placeholder='Find your dream jobs'
                        onChange={(e) => setQuery(e.target.value)}
                        className='outline-none border-none w-full bg-transparent text-foreground placeholder:text-muted-foreground'

                    />
                    <Button onClick={searchJobHandler} className="rounded-r-full">
                        <Search className='h-5 w-5' />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default HeroSection