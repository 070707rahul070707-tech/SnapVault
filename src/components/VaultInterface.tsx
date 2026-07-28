"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "../../lib/supabase/client"; 
import { 
  UploadCloud, Lock, Globe, Image as ImageIcon, 
  Trash2, Edit3, X, Check, Folder, ArrowLeft, Plus, Copy,
  ChevronLeft, ChevronRight 
} from "lucide-react";

export default function VaultInterface({ user }: { user: any }) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState("public");
  
  const [posts, setPosts] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false); 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public"); 
  const [folderName, setFolderName] = useState(""); 
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activePost, setActivePost] = useState<any | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0); 

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
    };
    fetchPosts();
  }, [user.id]);

  useEffect(() => {
    setActiveFolder(null);
  }, [activeTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]); 
      const newUrls = files.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]); 
    }
    // Reset input so you can click the + button to add more of the same files if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePreview = (indexToRemove: number) => {
    setPreviewUrls(previewUrls.filter((_, idx) => idx !== indexToRemove));
    setSelectedFiles(selectedFiles.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUploadSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`; 

        const { error: uploadError } = await supabase.storage
          .from('vault_images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('vault_images')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const newPostData = {
        user_id: user.id,
        username: user.user_metadata?.username || 'user',
        user_initial: (user.user_metadata?.username || 'U').charAt(0).toUpperCase(),
        images: uploadedUrls,
        caption: caption,
        visibility: visibility,
        folder: visibility === "personal" ? folderName.trim() : null,
      };

      const { data: insertedPost, error: dbError } = await supabase
        .from('posts')
        .insert([newPostData])
        .select()
        .single();

      if (dbError) throw dbError;

      setPosts([insertedPost, ...posts]);
      
      setIsUploadOpen(false);
      setPreviewUrls([]);
      setSelectedFiles([]);
      setCaption("");
      setVisibility("public");
      setFolderName("");

    } catch (error: any) {
      alert("Error uploading: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (post: any) => {
    setActivePost(post);
    setEditCaption(post.caption || "");
    setCurrentImageIndex(0); 
  };

  const handleSaveEdit = async () => {
    await supabase.from('posts').update({ caption: editCaption }).eq('id', activePost.id);
    setPosts(posts.map(p => p.id === activePost.id ? { ...p, caption: editCaption } : p));
    setActivePost(null);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this memory?")) {
      await supabase.from('posts').delete().eq('id', activePost.id);
      setPosts(posts.filter(p => p.id !== activePost.id));
      setActivePost(null);
    }
  };

  const displayedPosts = posts.filter(post => post.visibility === activeTab);
  
  const uniqueFolders = Array.from(new Set(
    displayedPosts.filter(p => p.folder).map(p => p.folder)
  ));

  return (
    <div className="min-h-screen pb-32 pt-8 md:pt-12 w-full max-w-5xl mx-auto px-4">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white flex items-center gap-3">
            My <span className="text-cyan-400 font-normal">Vault</span>
          </h1>
          <p className="text-neutral-400 mt-1">Manage your public and personal memories.</p>
        </div>
        
        <button 
          onClick={() => setIsUploadOpen(true)}
          className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-xl hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.3)] flex items-center gap-2"
        >
          <UploadCloud size={18} /> <span className="hidden md:block">Upload</span>
        </button>
      </div>

      <div className="flex gap-6 mb-6 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab("public")}
          className={`flex items-center gap-2 font-medium transition-colors ${activeTab === "public" ? "text-cyan-400" : "text-neutral-500 hover:text-white"}`}
        >
          <Globe size={18} /> Public Profile
        </button>
        <button 
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-2 font-medium transition-colors ${activeTab === "personal" ? "text-indigo-400" : "text-neutral-500 hover:text-white"}`}
        >
          <Lock size={18} /> Personal Vault
        </button>
      </div>

      {displayedPosts.length === 0 ? (
        <div className="w-full h-64 rounded-3xl bg-[#0a0a0a]/60 border border-white/5 backdrop-blur-md flex flex-col items-center justify-center text-neutral-500">
          <ImageIcon size={40} className="mb-3 opacity-50" />
          <p>No photos here yet.</p>
          <p className="text-sm">Click upload to add your first memory.</p>
        </div>
      ) : (
        <div>
          {activeTab === "personal" && (
            <div className="mb-6">
              {activeFolder ? (
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setActiveFolder(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-xl font-medium text-white flex items-center gap-2">
                    <Folder size={24} className="text-indigo-400 fill-indigo-400/20" /> 
                    {activeFolder}
                  </h2>
                </div>
              ) : (
                <>
                  {uniqueFolders.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {uniqueFolders.map(folder => (
                        <div 
                          key={folder}
                          onClick={() => setActiveFolder(folder)}
                          className="bg-[#111111]/80 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/50 hover:bg-white/5 transition-all group"
                        >
                          <Folder size={48} className="text-indigo-400 fill-indigo-400/10 group-hover:scale-110 transition-transform" />
                          <span className="text-white font-medium text-sm truncate w-full text-center">{folder}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedPosts
              .filter(post => activeTab === "personal" ? (activeFolder ? post.folder === activeFolder : !post.folder) : true)
              .map((post) => (
                <div 
                  key={post.id} 
                  onClick={() => openEditModal(post)}
                  className="group aspect-square rounded-2xl bg-neutral-900 overflow-hidden cursor-pointer relative border border-white/5 hover:border-cyan-500/50 transition-all"
                >
                  <img src={post.images[0]} alt="upload" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  
                  {post.images?.length > 1 && (
                    <div className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white">
                      <Copy size={16} />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <Edit3 className="text-white mb-2" size={24} />
                    <p className="text-white text-xs font-medium truncate w-full">{post.caption || "No caption"}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <h2 className="text-lg font-medium text-white">Upload Memories</h2>
              <button onClick={() => {setIsUploadOpen(false); setPreviewUrls([]); setSelectedFiles([]);}} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              <div className="w-full">
                {previewUrls.length === 0 ? (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 rounded-2xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex flex-col items-center justify-center cursor-pointer transition-colors"
                  >
                    <UploadCloud size={32} className="text-neutral-400 mb-2" />
                    <span className="text-sm text-neutral-400 font-medium">Select Images (Hold Ctrl to select multiple)</span>
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 items-center">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative shrink-0">
                        <img src={url} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                        <button 
                          onClick={() => removePreview(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white border-2 border-[#0a0a0a] hover:scale-110 transition-transform"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 shrink-0 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus size={24} className="text-neutral-400" />
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Caption</label>
                <textarea 
                  value={caption} 
                  onChange={(e) => setCaption(e.target.value)} 
                  placeholder="Write a caption for this post..."
                  className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all h-20 resize-none" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase">Visibility</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setVisibility("public")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${visibility === "public" ? "border-cyan-500 bg-cyan-500/10 text-cyan-400" : "border-white/10 text-neutral-500 hover:bg-white/5"}`}
                  >
                    <Globe size={16} /> Public
                  </button>
                  <button 
                    onClick={() => setVisibility("personal")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-all ${visibility === "personal" ? "border-indigo-500 bg-indigo-500/10 text-indigo-400" : "border-white/10 text-neutral-500 hover:bg-white/5"}`}
                  >
                    <Lock size={16} /> Personal
                  </button>
                </div>
              </div>

              {visibility === "personal" && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase flex items-center gap-2">
                    <Folder size={14} /> Add to Folder (Optional)
                  </label>
                  <input 
                    type="text" 
                    value={folderName} 
                    onChange={(e) => setFolderName(e.target.value)} 
                    placeholder="e.g. My Documents, Trip to Japan..."
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all" 
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 shrink-0">
              <button 
                onClick={handleUploadSubmit}
                disabled={previewUrls.length === 0 || isUploading}
                className="w-full py-3.5 bg-white text-black font-semibold rounded-xl hover:bg-neutral-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isUploading ? (
                  "Uploading to database..."
                ) : (
                  `Upload ${previewUrls.length > 0 ? previewUrls.length : ""} ${previewUrls.length > 1 ? "Photos as Carousel" : "Photo"}`
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* NEW: CSS SLIDER CAROUSEL */}
      {activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="w-full h-56 relative bg-black overflow-hidden flex items-center">
              
              {/* The Sliding Track */}
              <div 
                className="flex w-full h-full transition-transform duration-300 ease-out" 
                style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              >
                {activePost.images?.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="Memory" className="w-full h-full object-contain shrink-0" />
                ))}
              </div>
              
              <button 
                onClick={() => setActivePost(null)} 
                className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors z-20"
              >
                <X size={20} />
              </button>

              <div className="absolute top-4 left-4 flex gap-2 z-20">
                <div className={`px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-xs font-semibold text-white flex items-center gap-1 ${activePost.visibility === "personal" ? 'text-indigo-300' : 'text-cyan-300'}`}>
                  {activePost.visibility === "public" ? <Globe size={12} /> : <Lock size={12} />}
                  {activePost.visibility.toUpperCase()}
                </div>
              </div>

              {activePost.images?.length > 1 && (
                <>
                  {currentImageIndex > 0 && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(prev => prev - 1); }} 
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-10"
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  {currentImageIndex < activePost.images.length - 1 && (
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentImageIndex(prev => prev + 1); }} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-10"
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {activePost.images.map((_: any, idx: number) => (
                      <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-cyan-400' : 'bg-white/30'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase flex items-center gap-2">
                  <Edit3 size={14} /> Edit Caption
                </label>
                <textarea 
                  value={editCaption} 
                  onChange={(e) => setEditCaption(e.target.value)} 
                  className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all h-20 resize-none" 
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleDelete}
                  className="px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20 flex items-center justify-center"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="flex-1 py-3 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}