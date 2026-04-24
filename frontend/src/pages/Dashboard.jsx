import React, { useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LayoutDashboard, Search, ShieldCheck } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import PageTransition from '../components/PageTransition';
import UploadZone from '../components/UploadZone';
import DocumentList from '../components/DocumentList';
import { getDocuments } from '../api/documentService';

const Dashboard = () => {
    const { logout } = useContext(AuthContext);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getDocuments();
            setDocuments(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to securely load documents.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans transition-colors relative overflow-hidden">
                {/* Abstract background elements */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

                <header className="fixed top-0 left-0 right-0 h-20 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 z-50 flex items-center justify-between px-6 md:px-12">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                        >
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
                                DOCUSAFE<span className="text-white">VAULT</span>
                            </h1>
                            <div className="flex items-center gap-1.5 mt-1 text-emerald-400 text-xs font-semibold tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>END-TO-END ENCRYPTED</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search vault..."
                                className="w-64 pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium placeholder-slate-500"
                            />
                        </div>

                        <button
                            onClick={() => window.location.href = '/manage-shares'}
                            className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors px-4 py-2 rounded-xl hover:bg-slate-800/50 font-medium whitespace-nowrap"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Manage Shares</span>
                        </button>

                        <button
                            onClick={logout}
                            className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors px-4 py-2 rounded-xl hover:bg-slate-800/50 font-medium whitespace-nowrap"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Lock Vault</span>
                        </button>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto z-10 relative pt-32 pb-12">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8 flex flex-col items-center justify-center text-center"
                    >
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">Secure Document Upload</h2>
                        <p className="text-slate-500 max-w-lg text-sm">Drag and drop files to instantly encrypt and store them in your personal vault. Only you have access to these files.</p>
                    </motion.div>

                    <UploadZone onUploadSuccess={fetchDocuments} />

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="w-full max-w-5xl mx-auto mb-6 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <DocumentList documents={documents} loading={loading} />
                    </motion.div>
                </main>
            </div>
        </PageTransition>
    );
};

export default Dashboard;
