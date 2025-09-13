// app/api/chat-history/route.js
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getUserFromToken(token) {
  if (!token) return null;
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
    
    return user;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = await getUserFromToken(token);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat history for the user
    const { data: chats, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return Response.json({ chats: chats || [] });

  } catch (error) {
    console.error('Chat history error:', error);
    return Response.json({ error: 'Failed to load chat history' }, { status: 500 });
  }
}