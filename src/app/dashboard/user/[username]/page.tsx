"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  UserPlus, Check, MessageSquare, Grid as GridIcon, 
  Lock, ChevronLeft, ArrowLeft 
} from "lucide-react";
import Link from "next/link";

// Mock Data: Simulating their public posts
const mockPublicPosts = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1364&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1471&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=1460&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1470&auto=format&fit=crop"
];

export default function OtherUserProfile() {
  const params = useParams();
  const router = useRouter();
  
  // Gets the username from the URL (e.g., /dashboard/user/alex_design)
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername); 

  const [isFriendRequested, setIsFriendRequested] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="min-h-screen pb-32 pt-6 md:pt-10 w-full max-w-4xl mx-auto px-4 relative">
      
      {/* --- TOP BAR: Back Button & Username --- */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()} 
          className="p-2 text-neutral-400 hover:text-white transition-colors bg-white/5 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          @{username}
        </h1>
        <div className="w-10" /> {/* Spacer to keep username centered */}
      </div>

      {/* --- PROFILE HEADER (Instagram Style) --- */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
        
        {/* Big Avatar */}
        <div className="shrink-0">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 p-1">
            <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-[#0a0a0a]">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex-1 w-full text-center md:text-left flex flex-col gap-5">
          
          {/* Stats Row */}
          <div className="flex justify-center md:justify-start gap-8 md:gap-12 text-white">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold">{mockPublicPosts.length}</span>
              <span className="text-sm text-neutral-400">Posts</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold">1,240</span>
              <span className="text-sm text-neutral-400">Friends</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold">185</span>
              <span className="text-sm text-neutral-400">Following</span>
            </div>
          </div>

          {/* Bio Section */}
          <div>
            <h2 className="font-semibold text-white text-base mb-1">
              {username.replace('_', ' ').replace('.', ' ').toUpperCase()}
            </h2>
            <p className="text-sm text-neutral-300 max-w-sm mx-auto md:mx-0 leading-relaxed whitespace-pre-wrap">
              Digital creator & photography enthusiast. Capturing moments. 📸
            </p>
          </div>

          {/* --- THE ADD FRIEND & MESSAGE BUTTONS --- */}
          <div className="flex gap-3 justify-center md:justify-start">
            <button 
              onClick={() => setIsFriendRequested(!isFriendRequested)}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl font-semibold transition-all ${
                isFriendRequested 
                  ? "bg-neutral-800 text-white border border-white/10"
                  : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
              }`}
            >
              {isFriendRequested ? <Check size={18} /> : <UserPlus size={18} />}
              {isFriendRequested ? "Requested" : "Add Friend"}
            </button>
            
            <Link 
              href="/dashboard/chats"
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 bg-white/10 border border-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all"
            >
              <MessageSquare size={18} />
              Message
            </Link>
          </div>
        </div>
      </div>

      {/* --- GRID TABS --- */}
      <div className="flex justify-center border-t border-white/10 mb-1">
        <button 
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-widest border-t-2 transition-colors ${activeTab === "posts" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <GridIcon size={16} /> Public Posts
        </button>
      </div>

      {/* --- PHOTO GRID --- */}
      <div className="grid grid-cols-3 gap-1 md:gap-3">
        {mockPublicPosts.map((imgUrl, idx) => (
          <div 
            key={idx} 
            className="aspect-square bg-neutral-900 border border-white/5 hover:border-white/20 cursor-pointer transition-all flex items-center justify-center group overflow-hidden relative"
          >
            <img src={imgUrl} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            
            {/* Hover State */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-white font-bold text-lg">❤️ {Math.floor(Math.random() * 500) + 50}</span>
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}