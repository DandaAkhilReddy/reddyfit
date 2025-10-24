// hooks/useAdminAuth.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authenticateAdmin, getAdminProfile, UserProfile } from '../services/azureDbService';

interface AdminAuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
    user: null,
    loading: true,
    signIn: async () => {},
    signOut: () => {}
});

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const savedSession = sessionStorage.getItem('admin_session');
        if (savedSession) {
            const session = JSON.parse(savedSession);
            if (session.expiry > Date.now()) {
                setUser(getAdminProfile());
            } else {
                sessionStorage.removeItem('admin_session');
            }
        }
        setLoading(false);
    }, []);

    const signIn = async (email: string, password: string) => {
        if (authenticateAdmin(email, password)) {
            const adminProfile = getAdminProfile();
            setUser(adminProfile);
            
            // Store session (expires in 8 hours)
            const session = {
                uid: adminProfile.uid,
                expiry: Date.now() + (8 * 60 * 60 * 1000)
            };
            sessionStorage.setItem('admin_session', JSON.stringify(session));
        } else {
            throw new Error('Invalid admin credentials');
        }
    };

    const signOut = () => {
        setUser(null);
        sessionStorage.removeItem('admin_session');
    };

    return (
        <AdminAuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within AdminAuthProvider');
    }
    return context;
};
