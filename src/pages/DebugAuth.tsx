import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

export default function DebugAuth() {
    const { user, role, session, loading } = useAuth();
    const [dbRole, setDbRole] = useState<any>(null);

    useEffect(() => {
        async function checkDb() {
            if (user) {
                const { data: admin } = await supabase.from('admins' as any).select('*').eq('user_id', user.id).maybeSingle();
                const { data: roles } = await supabase.from('user_roles').select('*').eq('user_id', user.id);
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setDbRole({ admin, roles, profile });
            }
        }
        checkDb();
    }, [user]);

    return (
        <div className="container mx-auto p-8 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl text-red-600">⚠️ Auth Debugger (Confidential) ⚠️</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted rounded">
                            <h3 className="font-bold mb-2">Client State (Context)</h3>
                            <pre className="text-xs overflow-auto max-h-60">
                                {JSON.stringify({
                                    isLoading: loading,
                                    role: role,
                                    email: user?.email,
                                    id: user?.id,
                                    metadata: user?.user_metadata
                                }, null, 2)}
                            </pre>
                        </div>

                        <div className="p-4 bg-muted rounded">
                            <h3 className="font-bold mb-2">LocalStorage</h3>
                            <pre className="text-xs overflow-auto max-h-60">
                                {JSON.stringify({
                                    'sb-access-token': localStorage.getItem('sb-nloedcznsdblkbggdbfp-auth-token') ? 'EXISTS' : 'MISSING',
                                    'user_role': localStorage.getItem('user_role')
                                }, null, 2)}
                            </pre>
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50/50 rounded border border-blue-200">
                        <h3 className="font-bold mb-2">Database Permissions (Live Check via Client)</h3>
                        <pre className="text-xs overflow-auto max-h-60">
                            {dbRole ? JSON.stringify(dbRole, null, 2) : 'Loading DB check... (or user not logged in)'}
                        </pre>
                        {dbRole && !dbRole.admin && !dbRole.roles?.length && (
                            <p className="text-red-500 font-bold mt-2">❌ CRITICAL: User missing from 'admins' and 'user_roles' tables!</p>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
                        <Button variant="destructive" onClick={() => supabase.auth.signOut().then(() => window.location.reload())}>Force Sign Out</Button>
                        <Button onClick={() => window.location.href = "/admin/login"}>Go to Admin Login</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
