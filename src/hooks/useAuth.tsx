import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'lider' | 'membro' | 'pastor' | 'missionario';
  church_id?: string;
  supervisor_id?: string;
  birth_date?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  baptism_date?: string;
  conversion_date?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to prevent auth callback deadlock
          setTimeout(async () => {
            try {
              console.log('Fetching profile for user_id:', session.user.id);
              
              // Buscar perfil
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .maybeSingle();
              
              if (profileError) {
                console.error('Error fetching profile:', profileError);
                setProfile(null);
                setLoading(false);
                return;
              }
              
              if (!profileData) {
                console.log('No profile found for user');
                setProfile(null);
                setLoading(false);
                return;
              }
              
              // Buscar role principal da nova tabela user_roles
              const { data: roleData, error: roleError } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', session.user.id)
                .order('role', { ascending: true }) // Ordenar por prioridade
                .limit(1)
                .maybeSingle();
              
              if (roleError) {
                console.error('Error fetching role:', roleError);
              }
              
              // Combinar perfil com role atualizada
              const finalProfile = {
                ...profileData,
                role: roleData?.role || profileData.role // Usar role de user_roles ou fallback
              };
              
              console.log('Profile with role:', finalProfile);
              setProfile(finalProfile);
              setLoading(false);
            } catch (err) {
              console.error('Exception fetching profile:', err);
              setProfile(null);
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session);
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { error };
      }
      
      console.log('Sign in successful:', data);
      return { error: null };
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error };
      }
      
      console.log('Sign up successful:', data);
      return { error: null };
    } catch (err) {
      console.error('Sign up exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};