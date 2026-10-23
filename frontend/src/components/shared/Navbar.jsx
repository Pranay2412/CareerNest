import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { LogOut, User2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { USER_API_END_POINT } from '@/utils/constant'
import { setUser } from '@/redux/authSlice'
import { toast } from 'sonner'

const Navbar = () => {
    const { user } = useSelector(store => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const logoutHandler = async () => {
        try {
            const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
            if (res.data.success) {
                dispatch(setUser(null));
                navigate("/");
                toast.success(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response.data.message);
        }
    }
    return (
        <div className='sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur'>
            <div className='flex items-center justify-between mx-auto max-w-7xl h-16 px-4'>
                <Link to="/" className='text-2xl font-bold tracking-tight'>
                    Career<span className='text-primary'>Nest</span>
                </Link>
                <div className='flex items-center gap-12'>
                    <ul className='flex font-medium items-center gap-5 text-muted-foreground'>
                        {
                            user && user.role === 'recruiter' ? (
                                <>
                                    <li><Link className="transition-colors hover:text-foreground" to="/admin/companies">Companies</Link></li>
                                    <li><Link className="transition-colors hover:text-foreground" to="/admin/jobs">Jobs</Link></li>
                                </>
                            ) : (
                                <>
                                    <li><Link className="transition-colors hover:text-foreground" to="/">Home</Link></li>
                                    <li><Link className="transition-colors hover:text-foreground" to="/jobs">Jobs</Link></li>
                                    <li><Link className="transition-colors hover:text-foreground" to="/browse">Browse</Link></li>
                                </>
                            )
                        }
                    </ul>
                    {
                        !user ? (
                            <div className='flex items-center gap-2'>
                                <Link to="/login"><Button variant="outline">Login</Button></Link>
                                <Link to="/signup"><Button>Signup</Button></Link>
                            </div>
                        ) : (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Avatar className="cursor-pointer border border-border bg-secondary ring-2 ring-background">
                                        <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || "Profile"} />
                                        <AvatarFallback><User2 className="text-primary" /></AvatarFallback>
                                    </Avatar>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                    <div>
                                        <div className='flex gap-2 space-y-2'>
                                            <Avatar className="cursor-pointer border border-border bg-secondary ring-2 ring-background">
                                                <AvatarImage src={user?.profile?.profilePhoto} alt={user?.fullname || "Profile"} />
                                                <AvatarFallback><User2 className="text-primary" /></AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <h4 className='font-medium'>{user?.fullname}</h4>
                                                <p className='text-sm text-muted-foreground'>{user?.profile?.bio}</p>
                                            </div>
                                        </div>
                                        <div className='flex flex-col my-2 text-muted-foreground'>
                                            {
                                                user && user.role === 'student' && (
                                                    <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                        <User2 />
                                                        <Button variant="link"> <Link to="/profile">View Profile</Link></Button>
                                                    </div>
                                                )
                                            }

                                            <div className='flex w-fit items-center gap-2 cursor-pointer'>
                                                <LogOut />
                                                <Button onClick={logoutHandler} variant="link">Logout</Button>
                                            </div>
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default Navbar