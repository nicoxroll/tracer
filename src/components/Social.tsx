import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, Share2, Trophy, Target, Dumbbell } from 'lucide-react';

type Post = {
  id: string;
  content: string;
  post_type: string;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name: string;
  };
  routines?: {
    title: string;
    difficulty: string;
  };
};

export default function Social() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'goal' | 'achievement' | 'routine'>('goal');

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name),
          routines:routine_id (title, difficulty)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createPost() {
    if (!profile || !newPostContent.trim()) return;

    try {
      const { error } = await supabase.from('posts').insert({
        user_id: profile.id,
        content: newPostContent,
        post_type: newPostType,
      });

      if (error) throw error;
      setNewPostContent('');
      loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  }

  async function toggleLike(postId: string) {
    if (!profile) return;

    try {
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', profile.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from('post_likes').delete().eq('id', existingLike.id);
        await supabase.rpc('decrement_likes', { post_id: postId });
      } else {
        await supabase.from('post_likes').insert({
          post_id: postId,
          user_id: profile.id,
        });
        await supabase.rpc('increment_likes', { post_id: postId });
      }

      loadPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'achievement': return Trophy;
      case 'routine': return Dumbbell;
      default: return Target;
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'achievement': return 'Logro';
      case 'routine': return 'Rutina';
      default: return 'Meta';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-thin text-white mb-2">Social</h1>
        <p className="text-gray-400 font-light">Comparte tu progreso y conecta con otros</p>
      </div>

      <div className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6">
        <div className="flex gap-2 mb-4">
          {[
            { id: 'goal', label: 'Meta', icon: Target },
            { id: 'achievement', label: 'Logro', icon: Trophy },
            { id: 'routine', label: 'Rutina', icon: Dumbbell },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setNewPostType(type.id as typeof newPostType)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-light transition-all duration-300 ${
                newPostType === type.id
                  ? 'bg-white text-[#0a0a0a]'
                  : 'bg-[#0a0a0a] text-gray-400 hover:text-white'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>

        <textarea
          value={newPostContent}
          onChange={(e) => setNewPostContent(e.target.value)}
          placeholder="¿Qué quieres compartir?"
          className="w-full bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm px-4 py-3 text-white font-light focus:outline-none focus:border-white transition-colors duration-300 resize-none"
          rows={3}
        />

        <button
          onClick={createPost}
          disabled={!newPostContent.trim()}
          className="mt-4 px-6 py-2 bg-white text-[#0a0a0a] rounded-sm font-light hover:bg-gray-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Publicar
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const PostIcon = getPostIcon(post.post_type);
            return (
              <div
                key={post.id}
                className="bg-[#141414] border border-[#1f1f1f] rounded-sm p-6 hover:border-[#2f2f2f] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-300 rounded-sm flex items-center justify-center text-xl font-thin text-[#0a0a0a] flex-shrink-0">
                    {post.profiles?.username.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-light">{post.profiles?.full_name}</span>
                      <span className="text-gray-500 text-sm font-light">
                        @{post.profiles?.username}
                      </span>
                      <span className="text-gray-600 text-sm font-light">·</span>
                      <span className="text-gray-500 text-sm font-light">
                        {new Date(post.created_at).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <PostIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-400 font-light">
                        {getPostTypeLabel(post.post_type)}
                      </span>
                    </div>

                    <p className="text-white font-light mb-4">{post.content}</p>

                    {post.routines && (
                      <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-sm p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Dumbbell className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-white font-light">
                            {post.routines.title}
                          </span>
                          <span className="text-xs text-gray-400 font-light capitalize">
                            · {post.routines.difficulty}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => toggleLike(post.id)}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors duration-300"
                      >
                        <Heart className="w-5 h-5" />
                        <span className="text-sm font-light">{post.likes_count}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300">
                        <MessageCircle className="w-5 h-5" />
                        <span className="text-sm font-light">0</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300">
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
