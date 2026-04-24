import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, CheckCircle, X, Loader2, Clock, ChevronDown, Timer, Search, User as UserIcon } from 'lucide-react';
import { shareDocument, searchUsersByEmail } from '../api/documentService';

const ShareModal = ({ documentId, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [shareData, setShareData] = useState(null);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Custom Timer State
    const [durationValue, setDurationValue] = useState(10);
    const [durationUnit, setDurationUnit] = useState('minutes');
    const [oneTimeView, setOneTimeView] = useState(false);
    const [watermarkText, setWatermarkText] = useState('');
    const [watermarkOpacity, setWatermarkOpacity] = useState(15);
    const [watermarkSize, setWatermarkSize] = useState(14);
    const [watermarkDensity, setWatermarkDensity] = useState(100);

    // Targeted Sharing Search State
    const [targetUserId, setTargetUserId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Debounce Search Effect
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchQuery.trim().length >= 2) {
                setIsSearching(true);
                try {
                    const results = await searchUsersByEmail(searchQuery);
                    setSearchResults(results);
                } catch (err) {
                    console.error("Failed to search users:", err);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setTargetUserId(user.id);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleClearUser = () => {
        setSelectedUser(null);
        setTargetUserId('');
        setSearchQuery('');
    };

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');

            let val = parseFloat(durationValue);
            if (isNaN(val) || val <= 0) {
                setError("Please enter a valid number greater than 0.");
                setLoading(false);
                return;
            }

            // Convert everything to minutes for the backend
            let durationInMinutes = val;
            if (durationUnit === 'seconds') durationInMinutes = val / 60.0;
            if (durationUnit === 'hours') durationInMinutes = val * 60.0;

            const data = await shareDocument(documentId, durationInMinutes, targetUserId, oneTimeView, watermarkText, watermarkOpacity, watermarkSize, watermarkDensity);
            setShareData(data);
        } catch (err) {
            setError(err.response?.data || 'Failed to generate share link.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (shareData) {
            const shareUrl = `${window.location.origin}/share/${shareData.shareToken}`;
            navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="relative w-full max-w-md bg-slate-900 border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden p-6"
                >
                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <Timer className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-200">VAULT ACTIVE</h3>
                                <p className="text-xs text-slate-400">Set custom link expiry</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-slate-300 p-1"><X className="w-5 h-5" /></button>
                    </div>

                    {!shareData ? (
                        <div className="space-y-6 relative z-10">
                            <div className="flex gap-3">
                                <div className="flex-[2]">
                                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase">Amount</label>
                                    <input
                                        type="number"
                                        value={durationValue}
                                        onChange={(e) => setDurationValue(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-200 focus:border-blue-500/50 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex-[1] relative">
                                    <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase">Unit</label>
                                    <select
                                        value={durationUnit}
                                        onChange={(e) => setDurationUnit(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-3 pr-8 text-slate-300 appearance-none cursor-pointer outline-none"
                                    >
                                        <option value="seconds">Seconds</option>
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-9 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase">Recipient (Optional)</label>

                                {selectedUser ? (
                                    <div className="w-full bg-blue-500/10 border border-blue-500/30 rounded-xl py-3 px-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                                <UserIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-blue-300">{selectedUser.email}</p>
                                                <p className="text-xs text-blue-400/70">Targeted Recipient ID: {selectedUser.id}</p>
                                            </div>
                                        </div>
                                        <button onClick={handleClearUser} className="text-slate-400 hover:text-slate-200">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search user by email for private link..."
                                            className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-200 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-4 top-3.5 w-4 h-4 text-blue-400 animate-spin" />
                                        )}

                                        <AnimatePresence>
                                            {searchResults.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
                                                >
                                                    {searchResults.map((user) => (
                                                        <div
                                                            key={user.id}
                                                            onClick={() => handleSelectUser(user)}
                                                            className="px-4 py-3 hover:bg-slate-700/50 cursor-pointer flex items-center gap-3 transition-colors border-b border-slate-700/50 last:border-0"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-400">
                                                                <UserIcon className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-slate-200">{user.email}</p>
                                                                <p className="text-xs text-slate-500">ID: {user.id}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-xs font-medium text-slate-400 mb-1 ml-1 uppercase">Custom Watermark Text (Optional)</label>
                                <input
                                    type="text"
                                    value={watermarkText}
                                    onChange={(e) => setWatermarkText(e.target.value)}
                                    placeholder="e.g. KLH CONFIDENTIAL"
                                    className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 px-4 text-slate-200 focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600"
                                />
                            </div>

                            {watermarkText && (
                                <div className="space-y-3 bg-slate-950/30 p-4 rounded-xl border border-slate-800/50">
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <label>Opacity</label>
                                            <span className="text-blue-400 font-mono">{watermarkOpacity}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(e.target.value)} className="w-full accent-blue-500 hover:accent-blue-400 transition-all" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <label>Size</label>
                                            <span className="text-blue-400 font-mono">{watermarkSize}px</span>
                                        </div>
                                        <input type="range" min="10" max="50" value={watermarkSize} onChange={(e) => setWatermarkSize(e.target.value)} className="w-full accent-blue-500 hover:accent-blue-400 transition-all" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <label>Density</label>
                                            <span className="text-blue-400 font-mono">{watermarkDensity} Reps</span>
                                        </div>
                                        <input type="range" min="10" max="200" value={watermarkDensity} onChange={(e) => setWatermarkDensity(e.target.value)} className="w-full accent-blue-500 hover:accent-blue-400 transition-all" />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl cursor-pointer hover:bg-red-500/20 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={oneTimeView}
                                    onChange={(e) => setOneTimeView(e.target.checked)}
                                    className="w-5 h-5 rounded border-red-500/50 text-red-500 focus:ring-red-500/50 focus:ring-offset-slate-900 bg-slate-900"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-red-400">Burn After Reading</span>
                                    <span className="text-xs text-red-400/70">Link permanently self-destructs after 1 opening</span>
                                </div>
                            </label>

                            {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">{error}</div>}

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Generate Secure Link'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4 relative z-10">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center gap-3 text-yellow-500">
                                <Clock className="w-5 h-5" />
                                <span className="text-sm font-medium">Link expires in {durationValue} {durationUnit}</span>
                            </div>
                            <div className="relative">
                                <input readOnly value={`${window.location.origin}/share/${shareData.shareToken}`} className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-3 pl-4 pr-24 text-sm text-slate-300" />
                                <button onClick={handleCopy} className="absolute right-2 top-2 bottom-2 px-3 bg-blue-600 rounded-lg text-xs font-bold text-white">
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            <button onClick={() => setShareData(null)} className="w-full text-slate-400 text-sm hover:text-slate-200 transition-colors">Generate Another</button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShareModal;