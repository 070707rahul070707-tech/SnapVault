"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client"; 
import { 
  Heart, MessageCircle, Send, Search, Bookmark, 
  Bell, ChevronLeft, ChevronRight, X, Copy,
  UserPlus, UserCheck, Clock // NEW ICONS FOR FRIENDS
} from "lucide-react";

export default function Feed({ currentUser }: { currentUser: string }) {
  const supabase = createClient();
  
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});

  const [showNotifications, setShowNotifications] = useState(false);
  const [shareModalPost, setShareModalPost] = useState<any | null>(null);
  const [sentTo, setSentTo] = useState<string[]>([]);

  // --- NEW: REAL FRIEND SYSTEM STATE ---
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [acceptedFriends, setAcceptedFriends] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      let currentUserId = user?.id;
      if (currentUserId) setAuthUserId(currentUserId);

      // 1. Fetch Posts & Comments
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, comments(*)') 
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      // 2. Fetch Likes
      let likedPostIds = new Set();
      if (currentUserId) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId);
          
        if (likesData) {
          likesData.forEach(like => likedPostIds.add(like.post_id));
        }

        // 3. FETCH FRIEND REQUESTS & FRIENDS
        const { data: friendsData } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

        if (friendsData) {
          setIncomingRequests(friendsData.filter(r => r.receiver_id === currentUserId && r.status === 'pending'));
          setSentRequests(friendsData.filter(r => r.sender_id === currentUserId && r.status === 'pending'));
          setAcceptedFriends(friendsData.filter(r => r.status === 'accepted'));
        }
      }

      // Format Feed Data
      if (!postsError && postsData) {
        const formattedData = postsData.map(post => ({
          ...post,
          isLiked: likedPostIds.has(post.id), 
          comments: post.comments?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
        }));
        setFeedPosts(formattedData);
      }
      setIsLoading(false);
    };
    fetchUserAndData();
  }, []);

  // --- REAL FRIEND ACTIONS ---
  const handleAddFriend = async (receiverId: string, receiverUsername: string) => {
    if (!authUserId) return;
    
    // Optimistic UI Update
    const newReq = { sender_id: authUserId, sender_username: currentUser, receiver_id: receiverId, receiver_username: receiverUsername, status: 'pending' };
    setSentRequests([...sentRequests, newReq]);

    // Database Insert
    const { error } = await supabase.from('friend_requests').insert([newReq]);
    if (error) alert("Could not send friend request: " + error.message);
  };

  const handleAcceptFriend = async (requestId: string) => {
    // Optimistic UI Update
    const requestToAccept = incomingRequests.find(r => r.id === requestId);
    setIncomingRequests(incomingRequests.filter(r => r.id !== requestId));
    if (requestToAccept) {
      setAcceptedFriends([...acceptedFriends, { ...requestToAccept, status: 'accepted' }]);
    }

    // Database Update
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
  };

  const handleDeclineFriend = async (requestId: string) => {
    // Optimistic UI Update
    setIncomingRequests(incomingRequests.filter(r => r.id !== requestId));
    
    // Database Delete
    await supabase.from('friend_requests').delete().eq('id', requestId);
  };


  // --- LIKES & COMMENTS ACTIONS ---
  const handleLike = async (postId: string) => {
    if (!authUserId) return;
    const post = feedPosts.find(p => p.id === postId);
    if (!post) return;

    const currentlyLiked = post.isLiked;
    const newLikesCount = currentlyLiked ? Math.max(0, (post.likes || 1) - 1) : (post.likes || 0) + 1;

    setFeedPosts(feedPosts.map(p => 
      p.id === postId ? { ...p, isLiked: !currentlyLiked, likes: newLikesCount } : p
    ));

    if (currentlyLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: authUserId });
      await supabase.from('posts').update({ likes: newLikesCount }).eq('id', postId);
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: authUserId }]);
      await supabase.from('posts').update({ likes: newLikesCount }).eq('id', postId);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = newComments[postId]?.trim();
    if (!text || !authUserId) return;

    const tempComment = { id: Math.random().toString(), username: currentUser, text: text, created_at: new Date().toISOString() };
    setFeedPosts(feedPosts.map(p => 
      p.id === postId ? { ...p, comments: [...(p.comments || []), tempComment] } : p
    ));
    setNewComments({ ...newComments, [postId]: "" });

    const { error } = await supabase.from('comments').insert([
      { post_id: postId, user_id: authUserId, username: currentUser, text: text }
    ]);

    if (error) alert("Failed to post comment: " + error.message);
  };

  const handleSendPost = (friendId: string) => {
    setSentTo([...sentTo, friendId]);
    setTimeout(() => {
      setSentTo(sentTo.filter(id => id !== friendId)); 
    }, 2000);
  };

  return (
    <div className="min-h-screen pb-32 relative">
      
      {/* HEADER */}
      <div className="sticky top-0 z-40 w-full bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 px-4 py-4 flex justify-between items-center gap-4">
        <div className="relative w-full max-w-lg mx-auto flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111111] border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder-neutral-600"
          />
        </div>

        <div className="relative shrink-0">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-full transition-colors relative ${showNotifications ? 'bg-white/10 text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
          >
            <Bell size={24} />
            {incomingRequests.length > 0 && (
               <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#050505] animate-pulse" />
            )}
          </button>

          {/* REAL NOTIFICATIONS DROPDOWN */}
          {showNotifications && (
            <div className="absolute top-12 right-0 w-80 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
              <div className="p-4 border-b border-white/10 font-medium text-white flex justify-between items-center">
                Friend Requests
                <span className="bg-indigo-500 text-white text-xs px-2 py-0.5 rounded-full">{incomingRequests.length}</span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {incomingRequests.length === 0 ? (
                  <div className="p-6 text-center text-sm text-neutral-500">No new requests.</div>
                ) : (
                  incomingRequests.map(req => (
                    <div key={req.id} className="p-4 border-b border-white/5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Link href={`/dashboard/user/${req.sender_username}`} className="shrink-0">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold hover:scale-105 transition-transform">
                            {req.sender_username.charAt(0).toUpperCase()}
                          </div>
                        </Link>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            <span className="font-semibold">{req.sender_username}</span> wants to be friends.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAcceptFriend(req.id)}
                          className="flex-1 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleDeclineFriend(req.id)}
                          className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FEED CONTENT */}
      <div className="max-w-lg mx-auto mt-8 px-4 flex flex-col gap-10">
        {isLoading ? (
          <div className="text-center py-20 text-neutral-500">Loading your feed...</div>
        ) : feedPosts.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">No posts to show yet. Be the first to upload!</div>
        ) : (
          feedPosts.map((post) => {
            const currentIndex = imageIndices[post.id] || 0;
            const postImages = post.images || [];

            // Friend Status Checks
            const isSelf = post.user_id === authUserId;
            const isFriend = acceptedFriends.some(f => f.sender_id === post.user_id || f.receiver_id === post.user_id);
            const isPending = sentRequests.some(r => r.receiver_id === post.user_id) || incomingRequests.some(r => r.sender_id === post.user_id);
            
            return (
              <div key={post.id} className="w-full bg-[#0a0a0a]/60 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl group">
                
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Link href={`/dashboard/user/${post.username}`}>
                      <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold">
                        {post.user_initial || 'U'}
                      </div>
                    </Link>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/user/${post.username}`}>
                          <span className="font-medium text-white hover:text-indigo-400 transition-colors">{post.username}</span>
                        </Link>
                        
                        {/* ADD FRIEND BUTTON INJECTION */}
                        {!isSelf && !isFriend && !isPending && (
                          <button 
                            onClick={() => handleAddFriend(post.user_id, post.username)}
                            className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2 py-0.5 rounded-full"
                          >
                            <UserPlus size={12} /> Add
                          </button>
                        )}
                        {!isSelf && isPending && (
                          <span className="text-xs text-neutral-500 font-medium flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-full">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {!isSelf && isFriend && (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <UserCheck size={12} /> Friend
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="text-neutral-500 hover:text-white">•••</button>
                </div>

                <div className="w-full aspect-square bg-black relative overflow-hidden border-y border-white/5 group">
                  <div 
                    className="flex w-full h-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {postImages.map((img: string, idx: number) => (
                      <img key={idx} src={img} alt="Post" className="w-full h-full object-cover shrink-0" />
                    ))}
                  </div>
                  
                  {postImages.length > 1 && (
                    <div className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur-md rounded-lg text-white z-10">
                      <Copy size={16} />
                    </div>
                  )}

                  {postImages.length > 1 && (
                    <>
                      {currentIndex > 0 && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageIndices(prev => ({...prev, [post.id]: currentIndex - 1})); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-20 opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft size={20} />
                        </button>
                      )}
                      {currentIndex < postImages.length - 1 && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageIndices(prev => ({...prev, [post.id]: currentIndex + 1})); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors z-20 opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={20} />
                        </button>
                      )}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {postImages.map((_: any, idx: number) => (
                          <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentIndex ? 'bg-cyan-400' : 'bg-white/40'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-4">
                      <button onClick={() => handleLike(post.id)} className="transition-transform active:scale-90">
                        <Heart size={26} className={post.isLiked ? "fill-red-500 text-red-500" : "text-white hover:text-neutral-300"} />
                      </button>
                      <button className="transition-transform active:scale-90">
                        <MessageCircle size={26} className="text-white hover:text-neutral-300" />
                      </button>
                      <button onClick={() => setShareModalPost(post)} className="transition-transform active:scale-90">
                        <Send size={26} className="text-white hover:text-neutral-300" />
                      </button>
                    </div>
                    <button>
                      <Bookmark size={26} className="text-white hover:text-neutral-300" />
                    </button>
                  </div>

                  <div className="font-semibold text-sm mb-2">{post.likes || 0} likes</div>
                  <div className="text-sm mb-3">
                    <span className="font-semibold mr-2">{post.username}</span>
                    <span className="text-neutral-300">{post.caption}</span>
                  </div>

                  <div className="space-y-1 mb-4">
                    {post.comments?.length > 0 && (
                      <div className="text-sm text-neutral-500 cursor-pointer mb-2">
                        View all {post.comments.length} comments
                      </div>
                    )}
                    {post.comments?.map((comment: any) => (
                       <div key={comment.id} className="text-sm break-words">
                         <span className="font-semibold mr-2 text-indigo-300">{comment.username}</span>
                         <span className="text-neutral-300">{comment.text}</span>
                       </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 border-t border-white/10 pt-4 mt-2">
                    <input 
                      type="text" 
                      placeholder="Add a comment..." 
                      className="flex-1 bg-transparent text-sm focus:outline-none text-white placeholder-neutral-500"
                      value={newComments[post.id] || ""}
                      onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                    />
                    <button 
                      onClick={() => handleAddComment(post.id)} 
                      disabled={!newComments[post.id]?.trim()}
                      className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 disabled:text-neutral-600 transition-colors"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REAL SHARE MODAL (PULLS FROM DATABASE FRIENDS) */}
      {shareModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm" onClick={() => setShareModalPost(null)}>
          <div 
            className="w-full max-w-sm bg-[#111111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10 flex justify-between items-center relative">
              <div className="w-full text-center font-medium text-white">Share to Friends</div>
              <button onClick={() => setShareModalPost(null)} className="absolute right-4 text-neutral-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" size={16} />
                <input type="text" placeholder="Search your friends..." className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500/50" />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto p-2 custom-scrollbar">
              {acceptedFriends.length === 0 ? (
                 <div className="text-center py-8 px-4 text-sm text-neutral-500 flex flex-col items-center gap-2">
                    <UserPlus size={32} className="opacity-50" />
                    <span>No friends to share with yet.<br/>Click "Add" on a post to send a request!</span>
                 </div>
              ) : (
                acceptedFriends.map(friend => {
                  const isSender = friend.sender_id === authUserId;
                  const friendId = isSender ? friend.receiver_id : friend.sender_id;
                  const friendUsername = isSender ? friend.receiver_username : friend.sender_username;

                  return (
                    <div key={friend.id} className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {friendUsername?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-white font-medium text-sm">{friendUsername}</span>
                      </div>
                      <button 
                        onClick={() => handleSendPost(friendId)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${sentTo.includes(friendId) ? 'bg-neutral-800 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
                      >
                        {sentTo.includes(friendId) ? 'Sent' : 'Send'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}