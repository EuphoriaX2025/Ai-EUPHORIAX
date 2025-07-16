// src/components/ProfileManager.tsx

import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_AVATAR = '/default-avatar.png'; // مسیر آواتار پیش‌فرض شما در پوشه public

export const ProfileManager: React.FC = () => {
    const [username, setUsername] = useState<string>('');
    const [profilePic, setProfilePic] = useState<string>(DEFAULT_AVATAR);
    const [editMode, setEditMode] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // خواندن داده‌ها از localStorage هنگام بارگذاری اولیه
    useEffect(() => {
        const storedUsername = localStorage.getItem('dapp_username');
        const storedProfilePic = localStorage.getItem('dapp_profile_pic');

        if (storedUsername) {
            setUsername(storedUsername);
        } else {
            setEditMode(true); // اگر نامی وجود ندارد، حالت ویرایش را فعال کن
        }

        if (storedProfilePic) {
            setProfilePic(storedProfilePic);
        }
    }, []);
    
    // ذخیره داده‌ها در localStorage هنگام تغییر
    const handleSave = () => {
        localStorage.setItem('dapp_username', username);
        localStorage.setItem('dapp_profile_pic', profilePic);
        setEditMode(false);
    };

    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfilePic(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    if (!editMode) {
        return (
            <div className="profile-display">
                <img src={profilePic} alt="Profile" className="imaged w64 rounded" />
                <h4>{username}</h4>
                <button className="btn btn-sm btn-primary mt-1" onClick={() => setEditMode(true)}>Edit Profile</button>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-body">
                <h5 className="card-title">Set Your Profile</h5>
                <div className="form-group basic">
                    <label className="label">Display Name</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name"
                    />
                </div>
                <div className="form-group basic">
                    <label className="label">Profile Picture</label>
                    <div className="d-flex align-items-center">
                        <img src={profilePic} alt="Avatar Preview" className="imaged w64 rounded me-2" />
                        <button className="btn btn-sm btn-outline-primary" onClick={() => fileInputRef.current?.click()}>
                            Upload
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handlePictureChange}
                            accept="image/*"
                            style={{ display: 'none' }} 
                        />
                    </div>
                </div>
                <button className="btn btn-primary btn-block mt-2" onClick={handleSave}>Save Profile</button>
            </div>
        </div>
    );
};