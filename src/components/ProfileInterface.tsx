"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { 
  Settings, Grid as GridIcon, Bookmark, User as UserIcon, 
  Camera, Lock, LogOut, X, ChevronRight, Check, Copy, ChevronLeft,
  Loader2
} from "lucide-react";

export default function ProfileInterface({ user }: { user: any }) {
  const router = useRouter();
  const supabase = createClient();

  const initialUsername = user.user_metadata?.username || "user";
  const initialName = user.user_metadata?.name || "Your Name";
  const initialBio = user.user_metadata?.bio || "Digital creator & photography enthusiast. 🌌";
  const initialAvatar = user.user_metadata?.avatar_url || null;

  const [publicPosts, setPublicPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const [activeTab, setActiveTab] = useState("posts");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingView, setActiveSettingView] = useState("menu");

  const [username, setUsername] = useState(initialUsername);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPublicPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('visibility', 'public') 
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPublicPosts(data);
      }
      setIsLoadingPosts(false);
    };
    fetchPublicPosts();
  }, [user.id]);

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { name: name, username: username, bio: bio }
    });
    setLoading(false);
    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      setActiveSettingView("menu");
      router.refresh(); 
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (!error) {
      alert("Password updated successfully!");
      setActiveSettingView("menu");
      setNewPassword("");
    } else {
      alert(error.message);
    }
  };

  // --- REAL AVATAR UPLOAD LOGIC ---
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`; 

      // 1. Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update User Metadata in Auth
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      router.refresh(); // Tell Next.js to update the page
    } catch (error: any) {
      alert("Error uploading profile picture: " + error.message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 pt-8 md:pt-12 w-full max-w-4xl mx-auto px-4">
      
      <div className="flex items-center justify-between mb-8">
        <div className="w-8" />
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Lock size={16} className="text-neutral-500" />
          {username}
        </h1>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <Settings size={28} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
        <div className="relative group shrink-0">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 p-1">
            <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-[#0a0a0a] overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>
          </div>
          <button 
            onClick={() => { setIsSettingsOpen(true); setActiveSettingView("edit-profile"); }}
            className="absolute bottom-0 right-0 p-2.5 bg-neutral-800 border-2 border-[#0a0a0a] rounded-full text-white hover:bg-neutral-700 transition-colors"
          >
            <Camera size={18} />
          </button>
        </div>

        <div className="flex-1 w-full text-center md:text-left flex flex-col gap-5">
          <div className="flex justify-center md:justify-start gap-8 md:gap-12 text-white">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold">{publicPosts.length}</span>
              <span className="text-sm text-neutral-400">Posts</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold">0</span>
              <span className="text-sm text-neutral-400">Friends</span>
            </div>
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xl font-bold">0</span>
              <span className="text-sm text-neutral-400">Following</span>
            </div>
          </div>

          <div>
            <h2 className="font-semibold text-white text-base mb-1">{name}</h2>
            <p className="text-sm text-neutral-300 max-w-sm mx-auto md:mx-0 leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
          </div>

          <div className="flex gap-2 justify-center md:justify-start">
            <button 
              onClick={() => { setIsSettingsOpen(true); setActiveSettingView("edit-profile"); }}
              className="w-full md:w-auto px-8 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center border-t border-white/10 mb-1">
        <button 
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-widest border-t-2 transition-colors ${activeTab === "posts" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <GridIcon size={16} /> Posts
        </button>
        <button 
          onClick={() => setActiveTab("saved")}
          className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold uppercase tracking-widest border-t-2 transition-colors ${activeTab === "saved" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <Bookmark size={16} /> Saved
        </button>
      </div>

      {activeTab === "saved" ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-neutral-500">
          <Bookmark size={40} className="mb-3 opacity-50" />
          <p>No saved posts yet.</p>
        </div>
      ) : isLoadingPosts ? (
        <div className="w-full py-20 flex justify-center text-neutral-500">Loading posts...</div>
      ) : publicPosts.length === 0 ? (
        <div className="w-full py-20 flex flex-col items-center justify-center text-neutral-500">
          <GridIcon size={40} className="mb-3 opacity-50" />
          <p>No public posts yet.</p>
          <p className="text-sm">Upload to your Vault and mark as Public!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-3">
          {publicPosts.map((post) => (
            <div 
              key={post.id} 
              onClick={() => {
                setSelectedPost(post);
                setCurrentImageIndex(0);
              }}
              className="aspect-square bg-neutral-900 border border-white/5 hover:border-white/20 cursor-pointer transition-all flex items-center justify-center group overflow-hidden relative"
            >
              <img src={post.images[0]} alt="Post" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              
              {post.images?.length > 1 && (
                <div className="absolute top-2 right-2 p-1.5 drop-shadow-md text-white">
                  <Copy size={20} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <span className="text-white font-bold text-lg">❤️ {post.likes || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setSelectedPost(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-neutral-300 z-50">
            <X size={32} />
          </button>

          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] rounded-xl overflow-hidden flex flex-col md:flex-row border border-white/10 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="w-full md:w-[60%] bg-black relative flex items-center justify-center min-h-[40vh] md:min-h-0 overflow-hidden">
              
              <div 
                className="flex w-full h-full transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {selectedPost.images?.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="Post" className="w-full h-full object-contain shrink-0 max-h-[70vh]" />
                ))}
              </div>
              
              {selectedPost.images?.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(prev => prev - 1); }} 
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-10"
                    >
                      <ChevronLeft size={24} />
                    </button>
                  )}
                  {currentImageIndex < selectedPost.images.length - 1 && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(prev => prev + 1); }} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-10"
                    >
                      <ChevronRight size={24} />
                    </button>
                  )}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {selectedPost.images.map((_: any, idx: number) => (
                      <div key={idx} className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-cyan-400' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="w-full md:w-[40%] flex flex-col border-l border-white/10 bg-[#0a0a0a]">
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedPost.user_initial || "U"
                  )}
                </div>
                <span className="font-semibold text-white text-sm">{selectedPost.username}</span>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs shrink-0 overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      selectedPost.user_initial || "U"
                    )}
                  </div>
                  <p className="text-sm text-white"><span className="font-semibold mr-2">{selectedPost.username}</span>{selectedPost.caption}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0a0a0a]/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-white/10 relative">
              {activeSettingView !== "menu" && (
                <button 
                  onClick={() => setActiveSettingView("menu")}
                  className="absolute left-6 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={24} className="rotate-180" />
                </button>
              )}
              <h2 className="text-lg font-medium text-white w-full text-center">
                {activeSettingView === "menu" ? "Settings" : 
                 activeSettingView === "edit-profile" ? "Edit Profile" : 
                 "Change Password"}
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="absolute right-6 text-neutral-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-2">
              
              {activeSettingView === "menu" && (
                <div className="flex flex-col">
                  <button onClick={() => setActiveSettingView("edit-profile")} className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 rounded-xl transition-colors">
                    <span className="flex items-center gap-3"><UserIcon size={18} /> Edit Profile</span>
                    <ChevronRight size={18} className="text-neutral-500" />
                  </button>
                  <button onClick={() => setActiveSettingView("change-password")} className="w-full flex items-center justify-between p-4 text-white hover:bg-white/5 rounded-xl transition-colors">
                    <span className="flex items-center gap-3"><Lock size={18} /> Change Password</span>
                    <ChevronRight size={18} className="text-neutral-500" />
                  </button>
                  <div className="h-px bg-white/10 my-2 mx-4" />
                  <button onClick={handleLogout} disabled={loading} className="w-full flex items-center justify-between p-4 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <span className="flex items-center gap-3"><LogOut size={18} /> {loading ? "Logging out..." : "Log Out"}</span>
                  </button>
                </div>
              )}

              {activeSettingView === "edit-profile" && (
                <div className="p-4 space-y-5">
                  <div className="flex flex-col items-center mb-6">
                    
                    {/* HIDDEN FILE INPUT */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleAvatarUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />

                    <div 
                      className="relative group cursor-pointer" 
                      onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                    >
                      <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center text-3xl font-bold text-white border-2 border-[#0a0a0a] overflow-hidden">
                        {isUploadingAvatar ? (
                          <Loader2 size={28} className="animate-spin text-white" />
                        ) : avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 mt-3 font-medium cursor-pointer" onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}>
                      {isUploadingAvatar ? "Uploading..." : "Change Profile Photo"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Username</label>
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Bio</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all h-24 resize-none" />
                  </div>

                  <button onClick={handleSaveProfile} disabled={loading} className="w-full py-3.5 mt-2 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                    {loading ? "Saving..." : <><Check size={18} /> Save Changes</>}
                  </button>
                </div>
              )}

              {activeSettingView === "change-password" && (
                <div className="p-4 space-y-5">
                  <p className="text-sm text-neutral-400 mb-4 text-center">Enter a new password for your account.</p>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">New Password</label>
                    <input 
                      type="password" 
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Minimum 6 characters"
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all" 
                    />
                  </div>
                  <button onClick={handleChangePassword} disabled={loading || newPassword.length < 6} className="w-full py-3.5 mt-4 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}