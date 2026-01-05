import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';
import { userAPI } from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  displayColor: string;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    displayColor: string;
  };
  reactions: Array<{
    id: string;
    emoji: string;
    userId: string;
    username: string;
  }>;
}

interface Room {
  id: string;
  name: string;
  isPrivate: boolean;
  hasHistoryAccess: boolean;
  creatorId?: string;
  isOwner?: boolean;
  memberIds?: string[];
}

interface ChatProps {
  user: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const Chat: React.FC<ChatProps> = ({ user, onLogout, onUserUpdate }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showInviteMembers, setShowInviteMembers] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  
  const [profileForm, setProfileForm] = useState({
    username: user.username,
    displayColor: user.displayColor,
  });

  const [roomForm, setRoomForm] = useState({
    name: '',
    selectedUsers: [] as string[],
    memberHistoryAccess: {} as { [userId: string]: boolean },
  });

  const [inviteForm, setInviteForm] = useState({
    selectedUsers: [] as string[],
    memberHistoryAccess: {} as { [userId: string]: boolean },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProfileForm({
      username: user.username,
      displayColor: user.displayColor,
    });
  }, [user.username, user.displayColor]);

  useEffect(() => {
    socketService.getRooms((data) => {
      setRooms(data.rooms);
      const generalRoom = data.rooms.find((r: Room) => r.name === 'General');
      if (generalRoom) {
        handleJoinRoom(generalRoom);
      }
    });

    socketService.onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    socketService.onTypingUsers((data) => {
      setTypingUsers(data.users.filter((u: string) => u !== user.username));
    });

    socketService.onReactionAdded((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, reactions: [...msg.reactions, data.reaction] }
            : msg
        )
      );
    });

    socketService.onReactionRemoved((data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, reactions: msg.reactions.filter((r) => r.id !== data.reactionId) }
            : msg
        )
      );
    });

    socketService.onConnectedUsers((data) => {
      setConnectedUsers(data.users);
    });

    socketService.onRoomCreated((room) => {
      setRooms((prev) => [...prev, room]);
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoinRoom = (room: Room) => {
    console.log('Joining room:', room);
    console.log('Room isOwner:', room.isOwner, 'isPrivate:', room.isPrivate);
    setCurrentRoom(room);
    setMessages([]);
    socketService.joinRoom(room.id, (data) => {
      setMessages(data.messages);
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && currentRoom) {
      socketService.sendMessage(currentRoom.id, messageInput.trim());
      setMessageInput('');
      handleStopTyping();
    }
  };

  const handleTyping = () => {
    if (!currentRoom) return;
    socketService.sendTyping(currentRoom.id, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleStopTyping(), 3000);
  };

  const handleStopTyping = () => {
    if (currentRoom) socketService.sendTyping(currentRoom.id, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    socketService.addReaction(messageId, emoji);
  };

  const handleRemoveReaction = (reactionId: string, messageId: string) => {
    socketService.removeReaction(reactionId, messageId);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await userAPI.updateProfile(profileForm);
      const updatedUser = response.data;
      onUserUpdate(updatedUser);
      setProfileForm({ username: updatedUser.username, displayColor: updatedUser.displayColor });
      socketService.updateProfile(updatedUser.username, updatedUser.displayColor);
      setShowProfile(false);
      alert('Profil mis à jour avec succès !');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomForm.name.trim()) return;

    const memberIds = [...roomForm.selectedUsers, user.id];
    const memberHistoryAccess: { [userId: string]: boolean } = {};
    memberHistoryAccess[user.id] = true;
    roomForm.selectedUsers.forEach((id) => {
      memberHistoryAccess[id] = roomForm.memberHistoryAccess[id] ?? true;
    });

    socketService.createRoom(roomForm.name, true, memberIds, memberHistoryAccess, (data) => {
      setShowCreateRoom(false);
      setRoomForm({ name: '', selectedUsers: [], memberHistoryAccess: {} });
      socketService.getRooms((roomsData) => {
        setRooms(roomsData.rooms);
        const newRoom = roomsData.rooms.find((r: Room) => r.id === data.room.id);
        if (newRoom) {
          handleJoinRoom(newRoom);
        }
      });
    });
  };

  const toggleUserSelection = (userId: string) => {
    setRoomForm((prev) => {
      const isSelected = prev.selectedUsers.includes(userId);
      const newSelectedUsers = isSelected
        ? prev.selectedUsers.filter((id) => id !== userId)
        : [...prev.selectedUsers, userId];
      
      const newHistoryAccess = { ...prev.memberHistoryAccess };
      if (!isSelected) {
        newHistoryAccess[userId] = true;
      } else {
        delete newHistoryAccess[userId];
      }
      
      return { ...prev, selectedUsers: newSelectedUsers, memberHistoryAccess: newHistoryAccess };
    });
  };

  const toggleHistoryAccess = (userId: string) => {
    setRoomForm((prev) => ({
      ...prev,
      memberHistoryAccess: { ...prev.memberHistoryAccess, [userId]: !prev.memberHistoryAccess[userId] },
    }));
  };

  const toggleInviteUserSelection = (userId: string) => {
    setInviteForm((prev) => {
      const isSelected = prev.selectedUsers.includes(userId);
      const newSelectedUsers = isSelected
        ? prev.selectedUsers.filter((id) => id !== userId)
        : [...prev.selectedUsers, userId];
      
      const newHistoryAccess = { ...prev.memberHistoryAccess };
      if (!isSelected) {
        newHistoryAccess[userId] = false;
      } else {
        delete newHistoryAccess[userId];
      }
      
      return { ...prev, selectedUsers: newSelectedUsers, memberHistoryAccess: newHistoryAccess };
    });
  };

  const toggleInviteHistoryAccess = (userId: string) => {
    setInviteForm((prev) => ({
      ...prev,
      memberHistoryAccess: { ...prev.memberHistoryAccess, [userId]: !prev.memberHistoryAccess[userId] },
    }));
  };

  const handleInviteMembers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || inviteForm.selectedUsers.length === 0) return;

    socketService.addMembersToRoom(
      currentRoom.id,
      inviteForm.selectedUsers,
      inviteForm.memberHistoryAccess,
      (data) => {
        if (data.success) {
          setShowInviteMembers(false);
          setInviteForm({ selectedUsers: [], memberHistoryAccess: {} });
          socketService.getRooms((roomsData) => {
            setRooms(roomsData.rooms);
            const updatedRoom = roomsData.rooms.find((r: Room) => r.id === currentRoom.id);
            if (updatedRoom) {
              setCurrentRoom(updatedRoom);
            }
          });
          alert('Membres invités avec succès !');
        } else {
          alert(data.error || 'Erreur lors de l\'invitation des membres');
        }
      }
    );
  };

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex overflow-hidden">
      
      <div className="w-80 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col">
        
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              NestChat
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="px-3 py-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-purple-300 hover:text-white text-sm font-medium"
                title="Profil"
              >
                Profil
              </button>
              <button
                onClick={onLogout}
                className="px-3 py-2 hover:bg-white/10 rounded-xl transition-all duration-300 text-purple-300 hover:text-white text-sm font-medium"
                title="Déconnexion"
              >
                Déconnexion
              </button>
            </div>
          </div>

          
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: user.displayColor }}
            >
              {user.username[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{user.username}</p>
              <p className="text-purple-300 text-xs">En ligne</p>
            </div>
          </div>
        </div>

        
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-purple-300 text-sm font-semibold uppercase tracking-wider">Salons</h3>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-3 py-1 hover:bg-white/10 rounded-lg transition-all duration-300 text-purple-300 hover:text-white text-xs font-medium"
              title="Créer un salon"
            >
              + Nouveau
            </button>
          </div>
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleJoinRoom(room)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-300 ${
                  currentRoom?.id === room.id
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-purple-400 font-bold">{room.isPrivate ? 'PRIVÉ' : '#'}</span>
                  <span className="text-white font-medium">{room.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        
        <div className="p-4 border-t border-white/10">
          <h3 className="text-purple-300 text-sm font-semibold uppercase tracking-wider mb-3">
            En ligne ({connectedUsers.length})
          </h3>
          <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-thin">
            {connectedUsers.map((u) => (
              <div key={u.userId} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: u.displayColor }}
                ></div>
                <span className="text-white text-sm">{u.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <div className="flex-1 flex flex-col">
        {showProfile ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Mon Profil</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-purple-200 text-sm font-medium">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all backdrop-blur-sm"
                    minLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-purple-200 text-sm font-medium">Couleur d'affichage</label>
                  <input
                    type="color"
                    value={profileForm.displayColor}
                    onChange={(e) => setProfileForm({ ...profileForm, displayColor: e.target.value })}
                    className="w-full h-12 rounded-2xl cursor-pointer"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProfile(false)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : showCreateRoom ? (
          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-md backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Créer un salon</h2>
              <form onSubmit={handleCreateRoom} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-purple-200 text-sm font-medium">Nom du salon</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all backdrop-blur-sm"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-purple-200 text-sm font-medium">Inviter des utilisateurs</label>
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin p-4 bg-white/5 rounded-2xl">
                    {connectedUsers.filter((u) => u.userId !== user.id).map((u) => (
                      <div key={u.userId} className="space-y-2 p-3 bg-white/5 rounded-xl">
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={roomForm.selectedUsers.includes(u.userId)}
                            onChange={() => toggleUserSelection(u.userId)}
                            className="w-4 h-4 rounded accent-purple-500"
                          />
                          <span>{u.username}</span>
                        </label>
                        {roomForm.selectedUsers.includes(u.userId) && (
                          <label className="flex items-center gap-2 ml-6 text-purple-200 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={roomForm.memberHistoryAccess[u.userId] ?? true}
                              onChange={() => toggleHistoryAccess(u.userId)}
                              className="w-4 h-4 rounded accent-purple-500"
                            />
                            <span>Accès historique</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Créer
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateRoom(false)}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : showInviteMembers ? (
          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
            <div className="w-full max-w-md backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 animate-fade-in">
              <h2 className="text-2xl font-bold text-white mb-6">Inviter des membres</h2>
              <form onSubmit={handleInviteMembers} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-purple-200 text-sm font-medium">Sélectionner des utilisateurs</label>
                  <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin p-4 bg-white/5 rounded-2xl">
                    {connectedUsers
                      .filter((u) => u.userId !== user.id && !currentRoom?.memberIds?.includes(u.userId))
                      .map((u) => (
                      <div key={u.userId} className="space-y-2 p-3 bg-white/5 rounded-xl">
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input
                            type="checkbox"
                            checked={inviteForm.selectedUsers.includes(u.userId)}
                            onChange={() => toggleInviteUserSelection(u.userId)}
                            className="w-4 h-4 rounded accent-purple-500"
                          />
                          <span>{u.username}</span>
                        </label>
                        {inviteForm.selectedUsers.includes(u.userId) && (
                          <label className="flex items-center gap-2 ml-6 text-purple-200 cursor-pointer text-sm">
                            <input
                              type="checkbox"
                              checked={inviteForm.memberHistoryAccess[u.userId] ?? false}
                              onChange={() => toggleInviteHistoryAccess(u.userId)}
                              className="w-4 h-4 rounded accent-purple-500"
                            />
                            <span>Accès historique (voir messages passés)</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={inviteForm.selectedUsers.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Inviter ({inviteForm.selectedUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteMembers(false);
                      setInviteForm({ selectedUsers: [], memberHistoryAccess: {} });
                    }}
                    className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all duration-300"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : currentRoom ? (
          <>
            
            <div className="p-4 border-b border-white/10 backdrop-blur-xl bg-slate-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {currentRoom.isPrivate ? 'PRIVÉ' : '#'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{currentRoom.name}</h2>
                    <p className="text-purple-300 text-sm">{messages.length} messages</p>
                  </div>
                </div>
                {currentRoom.isOwner && currentRoom.isPrivate && (
                  <button
                    onClick={() => setShowInviteMembers(true)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-xl transition-all duration-300"
                    title="Inviter des membres"
                  >
                    + Inviter
                  </button>
                )}
              </div>
            </div>

            
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="group animate-slide-up">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: message.user.displayColor }}
                    >
                      {message.user.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold" style={{ color: message.user.displayColor }}>{message.user.username}</span>
                        <span className="text-xs text-purple-300">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-2.5 border border-white/10">
                        <p className="text-white">{message.content}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {message.reactions.map((reaction) => (
                          <button
                            key={reaction.id}
                            onClick={() => {
                              if (reaction.userId === user.id) {
                                handleRemoveReaction(reaction.id, message.id);
                              }
                            }}
                            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-all duration-300"
                            title={reaction.username}
                          >
                            {reaction.emoji}
                          </button>
                        ))}
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity duration-300">
                          {emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleAddReaction(message.id, emoji)}
                              className="w-8 h-8 hover:scale-125 transition-transform duration-200 text-lg"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            
            {typingUsers.length > 0 && (
              <div className="px-6 py-2 text-purple-300 text-sm italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} est en train d'écrire...`
                  : `${typingUsers.join(', ')} sont en train d'écrire...`}
              </div>
            )}

            
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 backdrop-blur-xl bg-slate-900/30">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    handleTyping();
                  }}
                  placeholder={`Message dans ${currentRoom.name}...`}
                  className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300"
                >
                  Envoyer
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4 text-white text-4xl font-bold">
                Chat
              </div>
              <p className="text-purple-300 text-lg">Sélectionnez un salon pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
