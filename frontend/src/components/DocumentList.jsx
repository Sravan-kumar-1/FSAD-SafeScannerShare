import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, HardDrive, Inbox, Eye, Link, Activity } from 'lucide-react';
import ShareModal from './ShareModal';
import AuditModal from './AuditModal';

const DocumentList = ({ documents, loading }) => {
    const navigate = useNavigate();
    const [sharingDocId, setSharingDocId] = useState(null);
    const [auditDocId, setAuditDocId] = useState(null);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) {
        return (
            <div className="w-full flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!documents || documents.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-4xl mx-auto mt-12 text-center"
            >
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                        <Inbox className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-xl font-medium text-slate-300 mb-2">Your Vault is Empty</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                        Upload your first encrypted document above to get started. All files are securely stored.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto mt-8 relative">
            <div className="absolute -inset-4 bg-gradient-to-b from-blue-500/5 to-purple-500/5 blur-2xl font-none -z-10" />

            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-800/50 text-slate-400 text-sm tracking-wider uppercase bg-slate-800/30">
                                <th className="px-6 py-4 font-medium rounded-tl-3xl">Document Name</th>
                                <th className="px-6 py-4 font-medium">Size</th>
                                <th className="px-6 py-4 font-medium">Views</th>
                                <th className="px-6 py-4 font-medium">Uploaded</th>
                                <th className="px-6 py-4 font-medium text-right rounded-tr-3xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {documents.map((doc, index) => (
                                    <motion.tr
                                        key={doc.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="border-b border-slate-800/30 hover:bg-slate-800/40 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500/20 transition-all">
                                                    <FileText className="w-5 h-5 pointer-events-none" />
                                                </div>
                                                <div>
                                                    <p className="text-slate-200 font-medium truncate max-w-xs">{doc.fileName}</p>
                                                    <p className="text-slate-500 text-xs truncate max-w-xs">{doc.contentType}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <HardDrive className="w-4 h-4 text-slate-500" />
                                                {formatSize(doc.size)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <Eye className="w-4 h-4 text-slate-500" />
                                                {doc.viewCount || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                <Calendar className="w-4 h-4 text-slate-500" />
                                                {formatDate(doc.uploadedAt)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => setAuditDocId(doc.id)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Activity className="w-4 h-4" />
                                                    <span>Activity</span>
                                                </button>
                                                <button
                                                    onClick={() => setSharingDocId(doc.id)}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-yellow-300 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <Link className="w-4 h-4" />
                                                    <span>Share</span>
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/viewer/${doc.id}`)}
                                                    className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>View</span>
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Share Modal */}
            {sharingDocId && (
                <ShareModal
                    documentId={sharingDocId}
                    onClose={() => setSharingDocId(null)}
                />
            )}

            {/* Audit Modal */}
            {auditDocId && (
                <AuditModal
                    documentId={auditDocId}
                    onClose={() => setAuditDocId(null)}
                />
            )}
        </div>
    );
};

export default DocumentList;
