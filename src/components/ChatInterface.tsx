"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client"; // REAL DATABASE
import { 
  Search, Send, Image as ImageIcon, ArrowLeft, 
  Info, Trash2, User, Grid, MoreVertical, 
  Copy, Edit2, CornerUpRight, Users, Plus, X, Check, Mic, Loader2
} from "lucide-react";

export default function ChatInterface({ currentUser }: { currentUser: string }) {
  const supabase = createClient();
  const [authUserId, setAuthUserId] = useState<string | null>(null);

  // Main Chat States (Now completely empty by default, no mock data)
  const [chats, setChats] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChat, setActiveChat] = useState<any | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  
  // Message Options State
  const [activeMenuId, setActiveMenuId] = useState<any | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<any | null>(null);
  const [editMessageText, setEditMessageText] = useState("");

  // Group Creation States
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // --- 1. FETCH REAL FRIENDS FOR THE SIDEBAR ---
  useEffect(() => {
    const fetchFriends = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthUserId(user.id);

      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (data && !error && data.length > 0) {
        const realChats = data.map(req => {
          const isSender = req.sender_id === user.id;
          const friendId = isSender ? req.receiver_id : req.sender_id;
          const friendUsername = isSender ? req.receiver_username : req.sender_username;
          
          return {
            id: friendId,
            username: friendUsername,
            avatar: friendUsername?.charAt(0).toUpperCase() || 'U',
            lastMessage: "Tap to view chat",
            time: "",
            unread: 0,
            color: "from-indigo-500 to-cyan-500",
            isGroup: false
          };
        });
        setChats(realChats);
      }
      setIsLoadingChats(false);
    };
    fetchFriends();
  }, []);

  // --- 2. FETCH REAL MESSAGES WHEN A CHAT IS OPENED ---
  useEffect(() => {
    if (!activeChat || !authUserId || activeChat.isGroup) return;

    const fetchMsgs = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${authUserId},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${authUserId})`)
        .order('created_at', { ascending: true });

      if (data && !error) {
        const formatted = data.map(m => ({
          id: m.id,
          type: "text",
          text: m.text,
          sender: m.sender_id === authUserId ? "me" : "them",
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(formatted.length > 0 ? formatted : []);
      } else {
         setMessages([]); // Clear if no messages
      }
      setTimeout(scrollToBottom, 100);
    };
    fetchMsgs();

    // REAL-TIME LISTENER FOR INCOMING MESSAGES
    const channel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === authUserId && newMsg.receiver_id === activeChat.id) ||
          (newMsg.sender_id === activeChat.id && newMsg.receiver_id === authUserId)
        ) {
          setMessages(prev => [...prev, {
            id: newMsg.id,
            type: "text",
            text: newMsg.text,
            sender: newMsg.sender_id === authUserId ? "me" : "them",
            time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
          setTimeout(scrollToBottom, 100);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, authUserId]);

  // Filter chats for the sidebar
  const filteredChats = chats.filter(chat => 
    chat.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Use only real individual friends for group creation
  const availableFriendsForGroup = chats.filter(chat => !chat.isGroup);

  // --- MESSAGE ACTIONS (NOW CONNECTED TO SUPABASE) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !authUserId || !activeChat) return;
    
    const textToSend = newMessage.trim();
    setNewMessage(""); // Instantly clear input for UI

    // Optimistic UI update
    const tempMsg = {
      id: Date.now(),
      type: "text",
      text: textToSend,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(scrollToBottom, 50);

    // Save to Database
    if (!activeChat.isGroup) {
      await supabase.from('messages').insert([
        { sender_id: authUserId, receiver_id: activeChat.id, text: textToSend }
      ]);
    }
  };

  const handleVoiceMessage = () => {
    alert("In a real app, this would start recording audio! 🎤");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setActiveMenuId(null);
  };

  const handleUnsend = (id: any) => {
    setMessages(messages.filter(msg => msg.id !== id));
    setActiveMenuId(null);
    // Note: Would also delete from Supabase table here in future
  };

  const startEditing = (id: any, currentText: string) => {
    setEditingMsgId(id);
    setEditMessageText(currentText);
    setActiveMenuId(null);
  };

  const saveEdit = (id: any) => {
    if (!editMessageText.trim()) return;
    setMessages(messages.map(msg => 
      msg.id === id ? { ...msg, text: editMessageText } : msg
    ));
    setEditingMsgId(null);
    // Note: Would also update Supabase table here in future
  };

  const handleForward = () => {
    alert("Forward menu would open here!");
    setActiveMenuId(null);
  };

  const handleDeleteChat = () => {
    if (confirm("Are you sure you want to delete this chat? This cannot be undone.")) {
      setChats(chats.filter(c => c.id !== activeChat.id));
      setActiveChat(null);
      setShowInfo(false);
    }
  };

  // --- CREATE GROUP LOGIC ---
  const toggleFriendSelection = (id: any) => {
    if (selectedFriends.includes(id)) {
      setSelectedFriends(selectedFriends.filter(friendId => friendId !== id));
    } else {
      setSelectedFriends([...selectedFriends, id]);
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim() || selectedFriends.length === 0) return;

    const newGroup = {
      id: Date.now(),
      username: newGroupName.trim(),
      avatar: newGroupName.charAt(0).toUpperCase(),
      lastMessage: "Group created",
      time: "Just now",
      unread: 0,
      color: "from-indigo-600 to-purple-600",
      isGroup: true
    };

    setChats([newGroup, ...chats]); 
    setIsCreatingGroup(false);
    setNewGroupName("");
    setSelectedFriends([]);
    setActiveChat(newGroup); 
    setMessages([]); 
  };

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-screen w-full max-w-7xl mx-auto p-4 md:p-8 gap-6 pb-28 md:pb-8 relative">
      
      {/* --- CREATE GROUP OVERLAY MODAL --- */}
      {isCreatingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-xl font-medium text-white">New Group Chat</h2>
              <button onClick={() => setIsCreatingGroup(false)} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">Group Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Weekend Trip 🌴"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wider">Add Friends</label>
                <div className="h-48 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                  {availableFriendsForGroup.length === 0 ? (
                    <div className="text-center py-6 text-neutral-500 text-sm">
                      You need to add friends first before creating a group!
                    </div>
                  ) : (
                    availableFriendsForGroup.map(friend => (
                      <div 
                        key={friend.id}
                        onClick={() => toggleFriendSelection(friend.id)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${friend.color} flex items-center justify-center font-bold text-white`}>
                            {friend.avatar}
                          </div>
                          <span className="text-white font-medium">@{friend.username}</span>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedFriends.includes(friend.id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-neutral-600'}`}>
                          {selectedFriends.includes(friend.id) && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button 
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedFriends.length === 0}
                className="w-full py-3.5 bg-indigo-500 text-white font-semibold rounded-xl hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}


      {/* LEFT PANEL: Chat List */}
      <div className={`w-full md:w-96 flex-col bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-medium text-white">Messages</h1>
            <button 
              onClick={() => setIsCreatingGroup(true)}
              className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors" 
              title="New Group"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500" size={18} />
            <input
              type="text"
              placeholder="Search friends or groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder-neutral-600"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {isLoadingChats ? (
             <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
               <Loader2 className="w-6 h-6 animate-spin mb-3 text-indigo-500" />
               <span className="text-sm">Loading chats...</span>
             </div>
          ) : filteredChats.length === 0 ? (
             <div className="text-center py-12 px-6">
               <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                 <Users size={24} className="text-neutral-500" />
               </div>
               <h3 className="text-white font-medium mb-1">No chats yet</h3>
               <p className="text-sm text-neutral-500">Add friends from the feed to start messaging.</p>
             </div>
          ) : (
            filteredChats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => {
                  setActiveChat(chat);
                  setShowInfo(false);
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${activeChat?.id === chat.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
              >
                <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${chat.color} flex items-center justify-center text-xl font-bold text-white relative shadow-lg shrink-0`}>
                  {chat.isGroup ? <Users size={24} /> : chat.avatar}
                  {chat.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] font-bold text-white">
                      {chat.unread}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-semibold text-white truncate">{chat.username}</h3>
                    <span className="text-xs text-neutral-500 shrink-0">{chat.time}</span>
                  </div>
                  <p className={`text-sm truncate ${chat.unread > 0 ? 'text-white font-medium' : 'text-neutral-500'}`}>
                    {chat.lastMessage}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Active Chat Area */}
      {activeChat ? (
        <div className={`flex-1 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-3xl flex-col shadow-2xl relative overflow-hidden ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          
          <div className="h-20 border-b border-white/10 flex items-center justify-between px-6 bg-[#111111]/50 absolute top-0 w-full z-10 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <button onClick={() => setActiveChat(null)} className="md:hidden text-neutral-400 hover:text-white">
                <ArrowLeft size={24} />
              </button>
              
              <button 
                onClick={() => setShowInfo(!showInfo)}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${activeChat.color} flex items-center justify-center font-bold text-white`}>
                  {activeChat.isGroup ? <Users size={20} /> : activeChat.avatar}
                </div>
                <div>
                  <span className="font-semibold text-lg text-white block leading-tight">
                    {activeChat.isGroup ? activeChat.username : `@${activeChat.username}`}
                  </span>
                  <span className="text-xs text-neutral-400 block">Tap for info</span>
                </div>
              </button>
            </div>
            
            <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full transition-colors ${showInfo ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}>
              <Info size={24} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 pt-28 pb-24 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
               <div className="flex items-center justify-center h-full text-neutral-500">
                 Say hello to {activeChat.username}!
               </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === "me";
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div className="flex items-end gap-2 group relative">
                      
                      {/* The 3 Dots Menu */}
                      <div className={`relative ${isMe ? "order-1" : "order-2"}`}>
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                          className={`p-1.5 rounded-full text-neutral-500 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100 ${activeMenuId === msg.id ? 'opacity-100 bg-white/10 text-white' : ''}`}
                        >
                          <MoreVertical size={16} />
                        </button>

                        {activeMenuId === msg.id && (
                          <div className={`absolute top-8 ${isMe ? 'right-0' : 'left-0'} w-40 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden`}>
                            {msg.type === "text" && (
                              <button onClick={() => handleCopy(msg.text || "")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">
                                <Copy size={14} /> Copy
                              </button>
                            )}
                            <button onClick={handleForward} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">
                              <CornerUpRight size={14} /> Forward
                            </button>
                            
                            {isMe && msg.type === "text" && (
                              <button onClick={() => startEditing(msg.id, msg.text || "")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors">
                                <Edit2 size={14} /> Edit
                              </button>
                            )}
                            {isMe && (
                              <button onClick={() => handleUnsend(msg.id)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/5">
                                <Trash2 size={14} /> Unsend
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Message Bubble: Shared Post or Text */}
                      {msg.type === "shared_post" ? (
                        <div className={`w-64 rounded-2xl overflow-hidden shadow-md border border-white/10 bg-neutral-900 ${isMe ? "order-2" : "order-1"}`}>
                           <div className="p-3 border-b border-white/5 flex items-center gap-2">
                             <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white text-center">
                               {msg.postAuthor?.charAt(0).toUpperCase()}
                             </div>
                             <span className="text-xs font-semibold text-white">{msg.postAuthor}</span>
                           </div>
                           <img src={msg.postImage} alt="Shared Post" className="w-full h-auto object-cover" />
                           <div className="p-3 bg-black/50 backdrop-blur-md hover:bg-black/80 cursor-pointer transition-colors text-center">
                              <span className="text-xs text-white font-medium">View Post</span>
                           </div>
                        </div>
                      ) : (
                        <div className={`max-w-md px-5 py-3 rounded-2xl text-sm shadow-md ${isMe ? "bg-indigo-600 text-white rounded-br-sm order-2" : "bg-neutral-800 border border-white/5 text-white rounded-bl-sm order-1"}`}>
                          {editingMsgId === msg.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text" 
                                value={editMessageText}
                                onChange={(e) => setEditMessageText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(msg.id)}
                                className="bg-black/40 text-white px-2 py-1 rounded outline-none border border-indigo-400/50"
                                autoFocus
                              />
                              <button onClick={() => saveEdit(msg.id)} className="text-indigo-200 hover:text-white font-semibold text-xs">Save</button>
                            </div>
                          ) : (
                            msg.text
                          )}
                        </div>
                      )}

                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1 mx-1">{msg.time}</span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input with Image & Mic Icons */}
          <div className="absolute bottom-0 w-full p-4 bg-[#111111]/80 backdrop-blur-md border-t border-white/10">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <button type="button" className="p-3 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <ImageIcon size={20} />
              </button>
              
              <button type="button" onClick={handleVoiceMessage} className="p-3 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <Mic size={20} />
              </button>

              <input
                type="text"
                placeholder="Message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500/50 transition-all"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()}
                className="p-3 rounded-full bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 disabled:bg-neutral-800 disabled:text-neutral-500 transition-all shrink-0"
              >
                <Send size={20} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
              </button>
            </form>
          </div>

          {/* INFO SIDEBAR */}
          {showInfo && (
            <div className="absolute top-20 right-0 bottom-0 w-72 bg-[#050505] border-l border-white/10 z-20 flex flex-col shadow-2xl animate-in slide-in-from-right-8 duration-200">
              <div className="p-6 flex flex-col items-center border-b border-white/10">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${activeChat.color} flex items-center justify-center text-3xl font-bold text-white mb-3 shadow-lg`}>
                  {activeChat.isGroup ? <Users size={32} /> : activeChat.avatar}
                </div>
                <h3 className="font-semibold text-lg text-white text-center">
                  {activeChat.isGroup ? activeChat.username : `@${activeChat.username}`}
                </h3>
                
                {!activeChat.isGroup && (
                  <Link 
                    href={`/dashboard/user/${activeChat.username}`}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <User size={16} /> View Profile
                  </Link>
                )}
              </div>

              <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-4 text-white font-medium">
                  <Grid size={18} /> Shared Media
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square bg-neutral-900 border border-white/5 rounded-lg flex items-center justify-center hover:bg-neutral-800 cursor-pointer transition-colors">
                      <ImageIcon className="text-white/20" size={16} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t border-white/10">
                <button 
                  onClick={handleDeleteChat}
                  className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-red-500/20"
                >
                  <Trash2 size={18} /> {activeChat.isGroup ? 'Leave Group' : 'Delete Chat'}
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#0a0a0a]/60 backdrop-blur-xl border border-white/10 rounded-3xl">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <Send size={40} className="text-neutral-600 -translate-x-1 translate-y-1" />
          </div>
          <h2 className="text-2xl font-medium text-white mb-2">Your Messages</h2>
          <p className="text-neutral-500">Select a friend or create a group to start chatting.</p>
        </div>
      )}
    </div>
  );
}