import React, { useState, useEffect } from 'react';
import { RoomComment, RoomListing } from '../types';
import {
  fetchRoomComments,
  createRoomComment,
  likeRoomComment,
  deleteRoomComment
} from '../lib/supabaseClient';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  CornerDownRight,
  User,
  ShieldCheck,
  Trash2,
  Sparkles,
  HelpCircle,
  X,
  Clock,
  Phone
} from 'lucide-react';

interface RoomCommentsSectionProps {
  room: RoomListing;
  currentBrokerId?: string;
}

export const RoomCommentsSection: React.FC<RoomCommentsSectionProps> = ({
  room,
  currentBrokerId
}) => {
  const [comments, setComments] = useState<RoomComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('lopcampus_commenter_name') || '';
  });
  const [authorPhone, setAuthorPhone] = useState(() => {
    return localStorage.getItem('lopcampus_commenter_phone') || '';
  });
  const [authorRole, setAuthorRole] = useState<'student' | 'broker' | 'visitor'>(() => {
    return currentBrokerId ? 'broker' : 'student';
  });
  const [content, setContent] = useState('');
  const [replyTarget, setReplyTarget] = useState<RoomComment | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('lopcampus_liked_comments');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRoomComments(room.id);
      setComments(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    setReplyTarget(null);
  }, [room.id]);

  const quickQuestions = [
    '💧 Maji ya DAWASA yapo muda wote bila shida?',
    '⚡ Umeme ni luku yako binafsi?',
    '🚶 Umbali wa kutembea kwa miguu kufika chuoni ni dakika ngapi?',
    '🚪 Je, kuna geti na ulinzi salama usiku?',
    '💰 Kodi inalipwa kwa mwezi mmoja mmoja au miezi kadhaa?',
    '📶 Mtandao wa simu unashika vizuri ndani ya chumba?'
  ];

  const handleApplyQuickQuestion = (q: string) => {
    setContent(q);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const trimmedName = authorName.trim() || (authorRole === 'broker' ? 'Dalali wa Chumba' : 'Mwanafunzi');
    setIsSubmitting(true);

    try {
      localStorage.setItem('lopcampus_commenter_name', trimmedName);
      if (authorPhone.trim()) {
        localStorage.setItem('lopcampus_commenter_phone', authorPhone.trim());
      }

      const newComm = await createRoomComment({
        room_id: room.id,
        author_name: trimmedName,
        author_phone: authorPhone.trim() || undefined,
        author_role: authorRole,
        content: content.trim(),
        parent_id: replyTarget ? replyTarget.id : null,
        reply_to_name: replyTarget ? replyTarget.author_name : null
      });

      setComments((prev) => [...prev, newComm]);
      setContent('');
      setReplyTarget(null);
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (likedCommentIds.has(commentId)) return;

    const newLiked = new Set(likedCommentIds);
    newLiked.add(commentId);
    setLikedCommentIds(newLiked);
    try {
      localStorage.setItem('lopcampus_liked_comments', JSON.stringify(Array.from(newLiked)));
    } catch {
      // Ignored
    }

    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c))
    );

    await likeRoomComment(commentId);
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Una uhakika unataka kufuta maoni haya?')) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
    await deleteRoomComment(commentId);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Hivi punde';
    const time = new Date(isoString).getTime();
    if (isNaN(time)) return 'Hivi punde';
    const diffSec = Math.floor((Date.now() - time) / 1000);

    if (diffSec < 60) return 'Hivi sasa';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Dakika ${diffMin} zilizopita`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Saa ${diffHours} zilizopita`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Jana';
    if (diffDays < 14) return `Siku ${diffDays} zilizopita`;
    return 'Zaidi ya wiki 2 zilizopita';
  };

  // Group top-level comments and replies
  const topLevelComments = comments.filter((c) => !c.parent_id);
  const repliesByParentId: Record<string, RoomComment[]> = {};
  comments.forEach((c) => {
    if (c.parent_id) {
      if (!repliesByParentId[c.parent_id]) {
        repliesByParentId[c.parent_id] = [];
      }
      repliesByParentId[c.parent_id].push(c);
    }
  });

  return (
    <div className="pt-4 border-t border-neutral-200">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <span>Maoni & Maswali ya Chumba</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white">
                {comments.length}
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500">
              Uliza swali au soma majibu ya dalali na wapangaji wengine
            </p>
          </div>
        </div>
      </div>

      {/* Quick Suggestion Chips */}
      <div className="mb-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 mb-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Maswali ya haraka ya wanafunzi (Bofya kuandika haraka):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyQuickQuestion(q)}
              className="text-[11px] bg-neutral-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-neutral-700 px-2.5 py-1 rounded-full border border-neutral-200 transition-all text-left cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 mb-5 space-y-3">
        {replyTarget && (
          <div className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-1.5 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-1.5 font-medium truncate">
              <CornerDownRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Unajibu ujumbe wa: <strong>@{replyTarget.author_name}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReplyTarget(null)}
              className="text-neutral-500 hover:text-neutral-800 p-0.5 rounded-md hover:bg-blue-100 cursor-pointer"
              title="Ghairi kujibu"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          {/* Author Name */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Jina Lako *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Mf. Juma au Neema"
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 pl-7 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <User className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
            </div>
          </div>

          {/* Author Role */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Wewe ni:
            </label>
            <select
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value as any)}
              className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="student">🎓 Mwanafunzi / Mpangaji</option>
              <option value="broker">🏢 Dalali / Mwenye Nyumba</option>
              <option value="visitor">👤 Mgeni / Mdau</option>
            </select>
          </div>

          {/* Author Phone (Optional) */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
              Namba ya Simu (Hiari)
            </label>
            <div className="relative">
              <input
                type="tel"
                value={authorPhone}
                onChange={(e) => setAuthorPhone(e.target.value)}
                placeholder="Mf. 0712345678"
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 pl-7 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <textarea
            required
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              replyTarget
                ? `Andika jibu lako kwa @${replyTarget.author_name}...`
                : 'Andika swali au maoni yako kuhusu chumba hiki (Mf. maji, umeme, ulinzi, umbali)...'
            }
            className="w-full bg-white border border-neutral-300 rounded-xl p-2.5 text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <p className="text-[10px] text-neutral-500">
            * Maoni huonekana wazi kwa kila mtumiaji na dalali anaweza kukujibu.
          </p>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Inatuma...' : replyTarget ? 'Tuma Jibu' : 'Tuma Maoni'}</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      {isLoading ? (
        <div className="py-6 text-center text-xs text-neutral-400">
          Inapakia maoni...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-6 px-4 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <HelpCircle className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-60" />
          <p className="text-xs font-bold text-neutral-700">Bado hakuna maoni kwa chumba hiki</p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Kuwa wa kwanza kuuliza swali au kutoa maoni yako hapa juu!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {topLevelComments.map((comment) => {
            const replies = repliesByParentId[comment.id] || [];
            const isLiked = likedCommentIds.has(comment.id);

            return (
              <div key={comment.id} className="space-y-2">
                {/* Parent Comment Card */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-3.5 shadow-xs transition-shadow hover:shadow-sm">
                  {/* Author Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          comment.author_role === 'broker'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {comment.author_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-neutral-900">
                            {comment.author_name}
                          </span>

                          {comment.author_role === 'broker' ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              <span>Dalali / Mmiliki</span>
                            </span>
                          ) : (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-1.5 py-0.2 rounded-md">
                              Mwanafunzi
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatRelativeTime(comment.created_at)}</span>
                          {comment.author_phone && (
                            <span className="text-neutral-500 font-mono ml-1.5">
                              • Simu: {comment.author_phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete action if dalali or own comment */}
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="text-neutral-300 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                      title="Futa maoni haya"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-neutral-700 leading-relaxed pl-9 whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Actions: Like & Reply */}
                  <div className="flex items-center gap-3 pl-9 mt-2.5 pt-2 border-t border-neutral-100 text-[11px]">
                    <button
                      type="button"
                      onClick={() => handleLike(comment.id)}
                      className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                        isLiked ? 'text-blue-600' : 'text-neutral-500 hover:text-blue-600'
                      }`}
                    >
                      <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{comment.likes || 0} Penda</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReplyTarget(comment)}
                      className="flex items-center gap-1 text-neutral-500 hover:text-blue-600 font-semibold transition-colors cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Jibu</span>
                    </button>
                  </div>
                </div>

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-6 sm:pl-8 space-y-2 border-l-2 border-blue-200 ml-3">
                    {replies.map((reply) => {
                      const replyLiked = likedCommentIds.has(reply.id);
                      return (
                        <div
                          key={reply.id}
                          className="bg-neutral-50 border border-neutral-200/90 rounded-xl p-3 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                  reply.author_role === 'broker'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {reply.author_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-neutral-900 text-xs">
                                    {reply.author_name}
                                  </span>

                                  {reply.author_role === 'broker' ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      <span>Dalali</span>
                                    </span>
                                  ) : (
                                    <span className="bg-blue-100 text-blue-800 text-[9px] font-semibold px-1.5 py-0.2 rounded-md">
                                      Mpangaji
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] text-neutral-400 block">
                                  {formatRelativeTime(reply.created_at)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDelete(reply.id)}
                              className="text-neutral-300 hover:text-rose-500 p-1 rounded-md transition-colors cursor-pointer"
                              title="Futa jibu"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          <p className="text-neutral-700 leading-relaxed pl-8 whitespace-pre-wrap">
                            {reply.content}
                          </p>

                          <div className="flex items-center gap-3 pl-8 mt-2 text-[10px]">
                            <button
                              type="button"
                              onClick={() => handleLike(reply.id)}
                              className={`flex items-center gap-1 font-semibold transition-colors cursor-pointer ${
                                replyLiked ? 'text-blue-600' : 'text-neutral-500 hover:text-blue-600'
                              }`}
                            >
                              <ThumbsUp className={`w-2.5 h-2.5 ${replyLiked ? 'fill-current' : ''}`} />
                              <span>{reply.likes || 0} Penda</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
