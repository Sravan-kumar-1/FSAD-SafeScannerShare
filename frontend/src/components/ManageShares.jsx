import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Trash2, Link, FileText, User, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getActiveShares, revokeShare } from '../api/documentService';

const ManageShares = () => {
    const navigate = useNavigate();
    const [shares, setShares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [revoking, setRevoking] = useState(null);

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchShares();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // This is the cleanup function!
        return () => clearInterval(timer);
    }, [shares]);

    // Clean up expired shares automatically
    useEffect(() => {
        setShares(prev => prev.filter(share => new Date(share.expiresAt) > currentTime));
    }, [currentTime]);

    const fetchShares = async () => {
        try {
            setLoading(true);
            const data = await getActiveShares();
            setShares(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch active shares.');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (token) => {
        try {
            setRevoking(token);
            await revokeShare(token);
            // Remove the revoked share from local state to trigger fade-out
            setShares(prev => prev.filter(share => share.token !== token));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to revoke token');
        } finally {
            setRevoking(null);
        }
    };

    const getRemainingTime = (expiresAt) => {
        const diff = new Date(expiresAt) - currentTime;
        if (diff <= 0) return "00:00"; // Before auto-remove catches it

        const totalSeconds = Math.floor(diff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-[#020817] text-slate-200 p-6 md:p-12 relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10 space-y-8">
                {/* Header Profile Area */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all hover:pr-5 border border-slate-700/50"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center border-2 border-slate-800 shadow-xl">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Main Heading Content */}
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent">
                        Active Shares
                    </h1>
                    <p className="text-slate-400 text-lg flex items-center gap-2 font-medium">
                        <Link className="w-5 h-5 text-blue-400" />
                        Manage your live document distribution channels
                    </p>
                </div>

                {/* Dashboard Card */}
                <div className="bg-slate-900 border border-slate-800/60 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-400 font-medium">Scanning live sessions...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-400 bg-red-500/10 m-4 rounded-2xl border border-red-500/20">
                            {error}
                        </div>
                    ) : shares.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                            <Shield className="w-16 h-16 mb-6 opacity-20" />
                            <h3 className="text-2xl font-bold text-slate-300 mb-2">No active shared links found.</h3>
                            <p className="max-w-md text-center">You haven't generated any active sharing links recently. When you securely share documents, they will appear here to be managed.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-800/50 border-b border-slate-800 text-sm font-semibold tracking-wider text-slate-400">
                                        <th className="p-5 pl-8 font-medium">Document Name</th>
                                        <th className="p-5 font-medium">Recipient</th>
                                        <th className="p-5 font-medium">Time Remaining</th>
                                        <th className="p-5 pr-8 text-right font-medium">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    <AnimatePresence>
                                        {shares.map((share) => (
                                            <motion.tr
                                                key={share.token}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="hover:bg-slate-800/30 transition-colors group"
                                            >
                                                <td className="p-5 pl-8">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-200">
                                                                {share.documentName}
                                                            </span>
                                                            <div className="mt-1">
                                                                {share.isConsumed ? (
                                                                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                                                        BURNED
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                                        ACTIVE
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2 text-slate-300">
                                                        {share.recipient === 'Public Link' ? (
                                                            <Link className="w-4 h-4 text-emerald-400" />
                                                        ) : (
                                                            <User className="w-4 h-4 text-indigo-400" />
                                                        )}
                                                        <span className="font-medium bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50">
                                                            {share.recipient}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-1.5 bg-yellow-500/10 rounded text-yellow-500">
                                                            <Clock className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-mono text-sm tracking-wide text-slate-300">
                                                            {getRemainingTime(share.expiresAt)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5 pr-8 text-right">
                                                    <button
                                                        onClick={() => handleRevoke(share.token)}
                                                        disabled={revoking === share.token}
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all font-semibold shadow-lg shadow-red-500/0 hover:shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {revoking === share.token ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Revoking...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="w-4 h-4" />
                                                                Revoke Access
                                                            </>
                                                        )}
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ManageShares;
