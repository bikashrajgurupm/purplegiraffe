// app/api/chat-history/[id]/route.js
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
    return null;
  }
}

export async function DELETE(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = await getUserFromToken(token);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Delete the chat history entry
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return Response.json({ success: true });

  } catch (error) {
    console.error('Delete chat error:', error);
    return Response.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const user = await getUserFromToken(token);

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Get the specific chat session
    const { data: chat, error: chatError } = await supabase
      .from('chat_history')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (chatError) throw chatError;

    // Get all messages for this session
    const { data: messages, error: messagesError } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', chat.session_id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    return Response.json({ 
      chat,
      messages: messages || []
    });

  } catch (error) {
    console.error('Get chat error:', error);
    return Response.json({ error: 'Failed to load chat' }, { status: 500 });
  }
}