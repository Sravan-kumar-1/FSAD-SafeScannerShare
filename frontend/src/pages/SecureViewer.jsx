import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { AuthContext } from '../context/AuthContext';
import { streamDocument } from '../api/documentService';
import PageTransition from '../components/PageTransition';

// react-pdf styles
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SecureViewer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [numPages, setNumPages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [fileUrl, setFileUrl] = useState(null);
    const [timestamp, setTimestamp] = useState(new Date().toLocaleString());

    useEffect(() => {
        // Update timestamp every minute for the watermark
        const interval = setInterval(() => {
            setTimestamp(new Date().toLocaleString());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let objectUrl = null;

        const fetchDocument = async () => {
            try {
                setLoading(true);
                const blob = await streamDocument(id);

                // Ensure we handle plain text properly or render it in the PDF viewer if supported.
                // For react-pdf we primarily expect PDFs
                objectUrl = URL.createObjectURL(blob);
                setFileUrl(objectUrl);
            } catch (err) {
                console.error("Error streaming document:", err);
                setError("Failed to load document securely.");
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();

        // Clean up the object URL memory leak on unmount
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    // Generate a watermark pattern
    const WatermarkOverlay = () => {
        // Generate a fixed grid of watermarks
        const watermarks = Array(20).fill(null);
        return (
            <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden flex flex-wrap justify-center items-center opacity-10">
                {watermarks.map((_, i) => (
                    <div
                        key={i}
                        className="w-1/4 h-1/5 flex flex-col items-center justify-center -rotate-45"
                    >
                        <p className="text-slate-400 font-bold text-lg whitespace-nowrap">CONFIDENTIAL</p>
                        <p className="text-slate-500 text-sm whitespace-nowrap">{user?.email || 'Unknown User'}</p>
                        <p className="text-slate-500 text-xs whitespace-nowrap">{timestamp}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <PageTransition>
            <div className="min-h-screen bg-slate-950 text-white flex flex-col select-none">

                {/* Secure Header */}
                <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 z-50 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="font-medium text-slate-200">Secure Document Viewer</h1>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-500/10 px-3 py-1.5 rounded-full">
                        <ShieldCheck className="w-4 h-4" />
                        Copying Disabled
                    </div>
                </header>

                {/* Viewer Container - Disable right click */}
                <main
                    className="flex-1 pt-24 pb-12 px-4 flex justify-center bg-slate-950"
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="text-slate-400 animate-pulse">Decrypting and securely streaming...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md text-center">
                                <p className="font-medium mb-2">{error}</p>
                                <p className="text-sm opacity-80">Make sure this is a valid PDF and you have permission to view it.</p>
                            </div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative max-w-4xl w-full bg-slate-900 rounded-lg shadow-2xl shadow-blue-900/10 overflow-hidden"
                        >
                            <WatermarkOverlay />

                            <div className="flex justify-center flex-col items-center py-8">
                                {fileUrl && (
                                    <Document
                                        file={fileUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        loading={
                                            <div className="flex items-center gap-2 text-slate-400 py-12">
                                                <Loader2 className="w-5 h-5 animate-spin" /> Loading PDF engine...
                                            </div>
                                        }
                                        error={
                                            <div className="text-red-400 bg-red-500/10 p-4 rounded-lg m-8">
                                                Unable to render PDF. It may not be a valid PDF file. We uploaded a plain text file previously.
                                            </div>
                                        }
                                    >
                                        {Array.from(new Array(numPages || 0), (el, index) => (
                                            <Page
                                                key={`page_${index + 1}`}
                                                pageNumber={index + 1}
                                                className="mb-8 rounded-sm shadow-xl"
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                            />
                                        ))}
                                    </Document>
                                )}
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </PageTransition>
    );
};

export default SecureViewer;
