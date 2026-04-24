import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, Loader2, CheckCircle } from 'lucide-react';
import { uploadDocument } from '../api/documentService';

const UploadZone = ({ onUploadSuccess }) => {
    const fileInputRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState(null); // 'success' | 'error' | null
    const [errorMessage, setErrorMessage] = useState('');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsHovering(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsHovering(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsHovering(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        setUploadStatus(null);
        setErrorMessage('');

        try {
            await uploadDocument(selectedFile);
            setUploadStatus('success');
            setTimeout(() => {
                setSelectedFile(null);
                setUploadStatus(null);
                if (onUploadSuccess) onUploadSuccess();
            }, 2000);
        } catch (error) {
            setUploadStatus('error');
            setErrorMessage(error.response?.data || 'Failed to upload file.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleCancel = () => {
        setSelectedFile(null);
        setUploadStatus(null);
        setErrorMessage('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8 relative">
            {/* Decorative glows */}
            <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-xl pointer-events-none" />

            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl relative z-10 transition-colors duration-300">

                <AnimatePresence mode="wait">
                    {!selectedFile ? (
                        <motion.div
                            key="dropzone"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-12 px-6 cursor-pointer transition-all duration-300 ${isHovering
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-slate-600 bg-slate-800/20 hover:border-slate-500 hover:bg-slate-800/40'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            <motion.div
                                animate={{ y: isHovering ? -5 : 0 }}
                                className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 text-blue-400"
                            >
                                <UploadCloud className="w-8 h-8" />
                            </motion.div>

                            <h3 className="text-lg font-medium text-slate-200 mb-2">Click or drag a file here</h3>
                            <p className="text-slate-500 text-sm text-center max-w-sm">
                                Securely upload documents to your encrypted vault. Maximum file size 10MB.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="selected-file"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                                        <File className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-slate-200 font-medium truncate max-w-xs">{selectedFile.name}</h4>
                                        <p className="text-slate-500 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                {!isUploading && uploadStatus !== 'success' && (
                                    <button
                                        onClick={handleCancel}
                                        className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                            {uploadStatus === 'error' && (
                                <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                                    {errorMessage}
                                </div>
                            )}

                            {uploadStatus === 'success' ? (
                                <div className="flex items-center justify-center gap-2 text-emerald-400 py-2">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium bg-emerald-500/10 px-3 py-1 rounded-full">Upload Complete</span>
                                </div>
                            ) : (
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={handleCancel}
                                        disabled={isUploading}
                                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleUpload}
                                        disabled={isUploading}
                                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Encrypting & Uploading...
                                            </>
                                        ) : (
                                            'Secure Upload'
                                        )}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default UploadZone;
