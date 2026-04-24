import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload, Share2, Eye, History, User, MapPin } from 'lucide-react';
import { getAuditLogs } from '../api/documentService';

const AuditModal = ({ documentId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const data = await getAuditLogs(documentId);
                setLogs(data);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to securely fetch audit logs.');
            } finally {
                setLoading(false);
            }
        };

        if (documentId) {
            fetchLogs();
        }
    }, [documentId]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionStyles = (action) => {
        switch (action) {
            case 'UPLOAD':
                return {
                    icon: Upload,
                    colorClass: 'text-blue-400',
                    bgClass: 'bg-blue-500/10',
                    borderColor: 'border-blue-500/20'
                };
            case 'SHARE':
                return {
                    icon: Share2,
                    colorClass: 'text-yellow-400',
                    bgClass: 'bg-yellow-500/10',
                    borderColor: 'border-yellow-500/20'
                };
            case 'VIEW':
                return {
                    icon: Eye,
                    colorClass: 'text-emerald-400',
                    bgClass: 'bg-emerald-500/10',
                    borderColor: 'border-emerald-500/20'
                };
            default:
                return {
                    icon: History,
                    colorClass: 'text-slate-400',
                    bgClass: 'bg-slate-500/10',
                    borderColor: 'border-slate-500/20'
                };
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/50 shadow-2xl shadow-blue-900/20 rounded-3xl overflow-hidden max-h-[85vh] flex flex-col"
                >
                    {/* Abstract glows */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center shadow-inner">
                                <History className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-200">Security Audit Log</h3>
                                <p className="text-xs text-slate-400 font-medium tracking-wide">END-TO-END ACTIVITY TRACKER</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-500 hover:text-white hover:bg-slate-800 transition-colors p-2 rounded-xl"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 custom-scrollbar relative z-10">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                <p className="text-sm font-medium text-slate-400">Decrypting audit trail...</p>
                            </div>
                        ) : error ? (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-center shadow-inner">
                                {error}
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                                <History className="w-12 h-12 mb-4 opacity-50" />
                                <p className="font-medium text-lg">No activity yet</p>
                                <p className="text-sm mt-1">Actions on this document will appear here.</p>
                            </div>
                        ) : (
                            <div className="relative pl-6 border-l border-slate-800/80 space-y-8">
                                {logs.map((log, index) => {
                                    const style = getActionStyles(log.action);
                                    const Icon = style.icon;

                                    return (
                                        <motion.div
                                            key={log.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="relative"
                                        >
                                            {/* Timeline Dot */}
                                            <span className={`absolute -left-[45px] top-1 w-10 h-10 rounded-full flex items-center justify-center ${style.bgClass} ${style.colorClass} border border-slate-800 backdrop-blur-md shadow-lg shadow-black/20`}>
                                                <Icon className="w-4 h-4" />
                                            </span>

                                            {/* Log Entry Card */}
                                            <div className={`bg-slate-800/20 backdrop-blur-sm border ${style.borderColor} p-5 rounded-2xl ml-4 hover:bg-slate-800/40 transition-colors`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                    <span className={`font-bold tracking-wider text-sm ${style.colorClass}`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                                        {formatDate(log.timestamp)}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {log.username && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-900/50 px-3 py-2 rounded-lg w-max">
                                                            <User className="w-4 h-4 text-slate-500" />
                                                            <span className="font-medium">
                                                                {log.viewerEmail ? log.viewerEmail : (log.username === 'PUBLIC_VIEWER' ? 'Public External Viewer' : log.username)}
                                                                {log.viewerId && <span className="text-slate-500 ml-1">(ID: {log.viewerId})</span>}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {log.ipAddress && (
                                                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-slate-900/50 px-3 py-2 rounded-lg w-max">
                                                            <MapPin className="w-4 h-4 text-slate-500" />
                                                            <span className="font-mono text-xs">{log.ipAddress}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuditModal;
